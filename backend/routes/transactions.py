"""
Transactions Routes
Handles CRUD operations for property transactions (sales/rentals)
"""

from flask import Blueprint, request, jsonify, current_app, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta
import math
import csv
from io import StringIO

from models.models import TransactionModel, PropertyModel, ClientModel

transactions_bp = Blueprint('transactions', __name__)


def _escape_pdf_text(value):
    return str(value).replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def _build_simple_pdf(title, lines):
    """Generate a lightweight single-page PDF without external dependencies."""
    stream_lines = ["BT", "/F1 11 Tf", "50 780 Td"]
    stream_lines.append(f"({_escape_pdf_text(title)}) Tj")
    stream_lines.append("0 -20 Td")

    max_lines = 45
    for line in lines[:max_lines]:
        stream_lines.append(f"({_escape_pdf_text(line)}) Tj")
        stream_lines.append("0 -14 Td")

    stream_lines.append("ET")
    stream = "\n".join(stream_lines)
    stream_bytes = stream.encode('latin-1', errors='replace')

    objects = []
    objects.append("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    objects.append("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    objects.append(
        "3 0 obj\n"
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\n"
        "endobj\n"
    )
    objects.append("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
    objects.append(
        f"5 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode('latin-1')
        + stream_bytes
        + b"\nendstream\nendobj\n"
    )

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]

    for obj in objects:
        offsets.append(len(pdf))
        if isinstance(obj, bytes):
            pdf.extend(obj)
        else:
            pdf.extend(obj.encode('latin-1'))

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(offsets)}\n".encode('latin-1'))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode('latin-1'))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF"
        ).encode('latin-1')
    )
    return bytes(pdf)


def ensure_client_profile(db, user_doc):
    """Create client profile for a client account if missing."""
    user_id = str(user_doc['_id'])
    client = db.clients.find_one({'user_id': user_id})
    if client:
        return client

    payload = {
        'client_type': 'buyer',
        'source': 'website'
    }
    result = db.clients.insert_one(ClientModel.create_client(payload, user_id))
    return db.clients.find_one({'_id': result.inserted_id})


# ============================================
# GET ALL TRANSACTIONS
# ============================================
@transactions_bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get all transactions with optional filtering"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        # Check user role
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        # Pagination
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        skip = (page - 1) * limit
        
        # Build query
        query = {}
        
        # Non-admin users can only see their own transactions
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                query['agent_id'] = str(agent['_id'])
            else:
                query['_id'] = {'$exists': False}
        elif user.get('role') == 'client':
            client = ensure_client_profile(db, user)
            query['client_id'] = str(client['_id'])
        
        # Filter by transaction type
        transaction_type = request.args.get('transaction_type')
        if transaction_type:
            query['transaction_type'] = transaction_type
        
        # Filter by status
        status = request.args.get('status')
        if status:
            query['status'] = status
        
        # Filter by date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        if start_date or end_date:
            query['created_at'] = {}
            if start_date:
                query['created_at']['$gte'] = datetime.fromisoformat(start_date)
            if end_date:
                query['created_at']['$lte'] = datetime.fromisoformat(end_date)
        
        # Get total count
        total_count = db.transactions.count_documents(query)
        total_pages = math.ceil(total_count / limit) if limit > 0 else 1
        
        # Get transactions
        transactions_cursor = db.transactions.find(query).sort(
            'created_at', -1
        ).skip(skip).limit(limit)
        
        transactions = []
        for txn in transactions_cursor:
            txn_data = TransactionModel.to_dict(txn)
            
            # Get property details
            if txn.get('property_id') and ObjectId.is_valid(txn['property_id']):
                property_doc = db.properties.find_one({'_id': ObjectId(txn['property_id'])})
                if property_doc:
                    txn_data['property'] = {
                        'id': str(property_doc['_id']),
                        'title': property_doc.get('title'),
                        'address': property_doc.get('address'),
                        'images': property_doc.get('images', [])[:1]
                    }
            
            # Get client details
            if txn.get('client_id') and ObjectId.is_valid(txn['client_id']):
                client = db.clients.find_one({'_id': ObjectId(txn['client_id'])})
                if client:
                    client_user = db.users.find_one({'_id': ObjectId(client['user_id'])})
                    if client_user:
                        txn_data['client'] = {
                            'id': str(client['_id']),
                            'name': f"{client_user.get('first_name', '')} {client_user.get('last_name', '')}".strip(),
                            'email': client_user.get('email')
                        }
            
            transactions.append(txn_data)
        
        return jsonify({
            'success': True,
            'data': {
                'transactions': transactions,
                'pagination': {
                    'current_page': page,
                    'total_pages': total_pages,
                    'total_count': total_count,
                    'per_page': limit
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch transactions: {str(e)}'
        }), 500


# ============================================
# EXPORT TRANSACTIONS
# ============================================
@transactions_bp.route('/export', methods=['GET'])
@jwt_required()
def export_transactions():
    """Export filtered transactions as CSV, DOC, or PDF"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db

        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404

        query = {}

        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                query['agent_id'] = str(agent['_id'])
            else:
                query['_id'] = {'$exists': False}
        elif user.get('role') == 'client':
            client = ensure_client_profile(db, user)
            query['client_id'] = str(client['_id'])

        transaction_type = request.args.get('transaction_type')
        if transaction_type:
            query['transaction_type'] = transaction_type

        status = request.args.get('status')
        if status:
            query['status'] = status

        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        if start_date or end_date:
            query['created_at'] = {}
            if start_date:
                query['created_at']['$gte'] = datetime.fromisoformat(start_date)
            if end_date:
                query['created_at']['$lte'] = datetime.fromisoformat(end_date)

        export_limit = int(request.args.get('limit', 1000))
        export_format = (request.args.get('format') or 'pdf').lower()

        transactions_cursor = db.transactions.find(query).sort('created_at', -1).limit(export_limit)

        rows = []
        for txn in transactions_cursor:
            property_title = 'N/A'
            client_name = 'N/A'

            property_id = txn.get('property_id')
            if property_id and ObjectId.is_valid(property_id):
                property_doc = db.properties.find_one({'_id': ObjectId(property_id)})
                if property_doc:
                    property_title = property_doc.get('title', 'N/A')

            client_id = txn.get('client_id')
            if client_id and ObjectId.is_valid(client_id):
                client_doc = db.clients.find_one({'_id': ObjectId(client_id)})
                if client_doc and ObjectId.is_valid(client_doc.get('user_id', '')):
                    client_user = db.users.find_one({'_id': ObjectId(client_doc['user_id'])})
                    if client_user:
                        client_name = f"{client_user.get('first_name', '')} {client_user.get('last_name', '')}".strip() or client_user.get('email', 'N/A')

            rows.append({
                'id': str(txn.get('_id')),
                'property': property_title,
                'client': client_name,
                'type': txn.get('transaction_type', ''),
                'amount': float(txn.get('amount', 0)),
                'status': txn.get('status', ''),
                'date': txn.get('created_at').strftime('%Y-%m-%d %H:%M') if txn.get('created_at') else ''
            })

        if export_format == 'csv':
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['Transaction ID', 'Property', 'Client', 'Type', 'Amount', 'Status', 'Date'])
            for row in rows:
                writer.writerow([
                    row['id'],
                    row['property'],
                    row['client'],
                    row['type'],
                    f"{row['amount']:.2f}",
                    row['status'],
                    row['date']
                ])

            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=transactions-report.csv'}
            )

        if export_format in ['doc', 'document', 'docx']:
            body_rows = ''.join([
                (
                    f"<tr><td>{row['id']}</td><td>{row['property']}</td><td>{row['client']}</td>"
                    f"<td>{row['type']}</td><td>{row['amount']:.2f}</td><td>{row['status']}</td><td>{row['date']}</td></tr>"
                )
                for row in rows
            ])
            html = (
                "<html><head><meta charset='utf-8'><title>Transactions Report</title></head>"
                "<body><h2>Transactions Report</h2>"
                "<table border='1' cellspacing='0' cellpadding='6'>"
                "<thead><tr><th>Transaction ID</th><th>Property</th><th>Client</th><th>Type</th>"
                "<th>Amount</th><th>Status</th><th>Date</th></tr></thead>"
                f"<tbody>{body_rows}</tbody></table></body></html>"
            )
            return Response(
                html,
                mimetype='application/msword',
                headers={'Content-Disposition': 'attachment; filename=transactions-report.doc'}
            )

        if export_format == 'pdf':
            pdf_lines = []
            for row in rows:
                pdf_lines.append(
                    f"{row['date']} | {row['type'].upper()} | {row['status'].upper()} | "
                    f"{row['property']} | {row['client']} | {row['amount']:.2f}"
                )
            if not pdf_lines:
                pdf_lines.append('No transactions found for selected filters.')

            pdf_bytes = _build_simple_pdf('Transactions Report', pdf_lines)
            return Response(
                pdf_bytes,
                mimetype='application/pdf',
                headers={'Content-Disposition': 'attachment; filename=transactions-report.pdf'}
            )

        return jsonify({
            'success': False,
            'message': 'Unsupported export format. Use csv, pdf, or doc.'
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to export transactions: {str(e)}'
        }), 500


# ============================================
# GET SINGLE TRANSACTION
# ============================================
@transactions_bp.route('/<transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    """Get a single transaction by ID"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(transaction_id):
            return jsonify({
                'success': False,
                'message': 'Invalid transaction ID'
            }), 400
        
        transaction = db.transactions.find_one({'_id': ObjectId(transaction_id)})
        
        if not transaction:
            return jsonify({
                'success': False,
                'message': 'Transaction not found'
            }), 404
        
        # Check permission
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') != 'admin':
            if user.get('role') == 'agent':
                agent = db.agents.find_one({'user_id': current_user_id})
                if not agent or str(agent['_id']) != transaction.get('agent_id'):
                    return jsonify({
                        'success': False,
                        'message': 'Permission denied'
                    }), 403
            elif user.get('role') == 'client':
                client = ensure_client_profile(db, user)
                if str(client['_id']) != transaction.get('client_id'):
                    return jsonify({
                        'success': False,
                        'message': 'Permission denied'
                    }), 403
            else:
                return jsonify({
                    'success': False,
                    'message': 'Permission denied'
                }), 403
        
        txn_data = TransactionModel.to_dict(transaction)
        
        # Get property details
        if transaction.get('property_id') and ObjectId.is_valid(transaction['property_id']):
            property_doc = db.properties.find_one({'_id': ObjectId(transaction['property_id'])})
            if property_doc:
                txn_data['property'] = PropertyModel.to_dict(property_doc)
        
        # Get client details
        if transaction.get('client_id') and ObjectId.is_valid(transaction['client_id']):
            client = db.clients.find_one({'_id': ObjectId(transaction['client_id'])})
            if client:
                client_user = db.users.find_one({'_id': ObjectId(client['user_id'])})
                if client_user:
                    txn_data['client'] = {
                        'id': str(client['_id']),
                        'name': f"{client_user.get('first_name', '')} {client_user.get('last_name', '')}".strip(),
                        'email': client_user.get('email'),
                        'phone': client_user.get('phone')
                    }
        
        # Get agent details
        if transaction.get('agent_id') and ObjectId.is_valid(transaction['agent_id']):
            agent = db.agents.find_one({'_id': ObjectId(transaction['agent_id'])})
            if agent:
                agent_user = db.users.find_one({'_id': ObjectId(agent['user_id'])})
                if agent_user:
                    txn_data['agent'] = {
                        'id': str(agent['_id']),
                        'name': f"{agent_user.get('first_name', '')} {agent_user.get('last_name', '')}".strip(),
                        'email': agent_user.get('email'),
                        'phone': agent_user.get('phone')
                    }
        
        return jsonify({
            'success': True,
            'data': txn_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch transaction: {str(e)}'
        }), 500


# ============================================
# CREATE TRANSACTION
# ============================================
@transactions_bp.route('', methods=['POST'])
@jwt_required()
def create_transaction():
    """Create a new transaction"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        # Verify user role
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') not in ['agent', 'admin', 'client']:
            return jsonify({
                'success': False,
                'message': 'Permission denied'
            }), 403

        # Validate required property ID for all transaction creates
        if not data.get('property_id'):
            return jsonify({
                'success': False,
                'message': 'Property ID is required'
            }), 400
        
        # Validate property exists
        if not ObjectId.is_valid(data['property_id']):
            return jsonify({
                'success': False,
                'message': 'Invalid property ID'
            }), 400
        
        property_doc = db.properties.find_one({'_id': ObjectId(data['property_id'])})
        if not property_doc:
            return jsonify({
                'success': False,
                'message': 'Property not found'
            }), 404
        
        if user.get('role') == 'client':
            # Client initiates purchase/rental request
            client_profile = ensure_client_profile(db, user)
            data['client_id'] = str(client_profile['_id'])
            data['agent_id'] = property_doc.get('agent_id', '')
            data['amount'] = float(property_doc.get('price', 0))
            data['transaction_type'] = 'rent' if property_doc.get('listing_type') == 'rent' else 'sale'
            data['currency'] = property_doc.get('currency', 'USD')
            data['status'] = 'pending'
            data.setdefault('payment_method', 'bank_transfer')
            data.setdefault('notes', 'Client initiated purchase/rental request.')
        else:
            # Agent/Admin manual transaction creation
            required_fields = ['client_id', 'amount', 'transaction_type']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({
                        'success': False,
                        'message': f'{field.replace("_", " ").title()} is required'
                    }), 400

            if user.get('role') == 'agent':
                agent = db.agents.find_one({'user_id': current_user_id})
                if agent:
                    data['agent_id'] = str(agent['_id'])

        if property_doc.get('status') in ['sold', 'rented']:
            return jsonify({
                'success': False,
                'message': 'This property is no longer available'
            }), 400
        
        # Create transaction
        new_transaction = TransactionModel.create_transaction(data)
        result = db.transactions.insert_one(new_transaction)
        
        # Update property status
        new_status = 'pending'
        if data.get('status') == 'completed':
            new_status = 'sold' if data.get('transaction_type') == 'sale' else 'rented'
        
        db.properties.update_one(
            {'_id': ObjectId(data['property_id'])},
            {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        # Get created transaction
        transaction = db.transactions.find_one({'_id': result.inserted_id})
        txn_data = TransactionModel.to_dict(transaction)
        
        return jsonify({
            'success': True,
            'message': 'Transaction created successfully',
            'data': txn_data
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create transaction: {str(e)}'
        }), 500


# ============================================
# UPDATE TRANSACTION
# ============================================
@transactions_bp.route('/<transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    """Update an existing transaction"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(transaction_id):
            return jsonify({
                'success': False,
                'message': 'Invalid transaction ID'
            }), 400
        
        transaction = db.transactions.find_one({'_id': ObjectId(transaction_id)})
        
        if not transaction:
            return jsonify({
                'success': False,
                'message': 'Transaction not found'
            }), 404
        
        # Check permission
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if not agent or str(agent['_id']) != transaction.get('agent_id'):
                return jsonify({
                    'success': False,
                    'message': 'You can only update your own transactions'
                }), 403
        elif user.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Permission denied'
            }), 403
        
        # Build update data
        update_fields = [
            'amount', 'commission_percentage', 'status', 'payment_method',
            'contract_date', 'closing_date', 'documents', 'notes'
        ]
        
        update_data = {}
        for field in update_fields:
            if field in data:
                if field in ['contract_date', 'closing_date'] and data[field]:
                    update_data[field] = datetime.fromisoformat(data[field])
                else:
                    update_data[field] = data[field]
        
        # Recalculate commission if amount or percentage changed
        if 'amount' in update_data or 'commission_percentage' in update_data:
            amount = update_data.get('amount', transaction.get('amount', 0))
            pct = update_data.get('commission_percentage', transaction.get('commission_percentage', 3))
            update_data['commission'] = amount * (pct / 100)
        
        update_data['updated_at'] = datetime.utcnow()
        
        # Update transaction
        db.transactions.update_one(
            {'_id': ObjectId(transaction_id)},
            {'$set': update_data}
        )
        
        # Update property status if transaction status changed
        if 'status' in update_data and transaction.get('property_id'):
            if ObjectId.is_valid(transaction['property_id']):
                new_property_status = None
                if update_data['status'] == 'completed':
                    new_property_status = 'sold' if transaction.get('transaction_type') == 'sale' else 'rented'
                elif update_data['status'] == 'cancelled':
                    new_property_status = 'available'
                elif update_data['status'] in ['pending', 'in_progress']:
                    new_property_status = 'pending'
                
                if new_property_status:
                    db.properties.update_one(
                        {'_id': ObjectId(transaction['property_id'])},
                        {'$set': {'status': new_property_status, 'updated_at': datetime.utcnow()}}
                    )
        
        # Update agent stats if completed
        if update_data.get('status') == 'completed' and transaction.get('status') != 'completed':
            if transaction.get('agent_id') and ObjectId.is_valid(transaction['agent_id']):
                stat_field = 'stats.properties_sold' if transaction.get('transaction_type') == 'sale' else 'stats.properties_rented'
                db.agents.update_one(
                    {'_id': ObjectId(transaction['agent_id'])},
                    {
                        '$inc': {
                            stat_field: 1,
                            'stats.total_sales_value': transaction.get('amount', 0)
                        }
                    }
                )
        
        # Get updated transaction
        transaction = db.transactions.find_one({'_id': ObjectId(transaction_id)})
        txn_data = TransactionModel.to_dict(transaction)
        
        return jsonify({
            'success': True,
            'message': 'Transaction updated successfully',
            'data': txn_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to update transaction: {str(e)}'
        }), 500


# ============================================
# DELETE TRANSACTION
# ============================================
@transactions_bp.route('/<transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        current_user_id = get_jwt_identity()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(transaction_id):
            return jsonify({
                'success': False,
                'message': 'Invalid transaction ID'
            }), 400
        
        transaction = db.transactions.find_one({'_id': ObjectId(transaction_id)})
        
        if not transaction:
            return jsonify({
                'success': False,
                'message': 'Transaction not found'
            }), 404
        
        # Only admin can delete
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Only admins can delete transactions'
            }), 403
        
        # Reset property status if transaction was active
        if transaction.get('property_id') and transaction.get('status') in ['pending', 'in_progress']:
            if ObjectId.is_valid(transaction['property_id']):
                db.properties.update_one(
                    {'_id': ObjectId(transaction['property_id'])},
                    {'$set': {'status': 'available', 'updated_at': datetime.utcnow()}}
                )
        
        # Delete transaction
        db.transactions.delete_one({'_id': ObjectId(transaction_id)})
        
        return jsonify({
            'success': True,
            'message': 'Transaction deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete transaction: {str(e)}'
        }), 500


# ============================================
# GET TRANSACTION STATISTICS
# ============================================
@transactions_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_transaction_stats():
    """Get transaction statistics for dashboard"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        # Build base query based on user role
        base_query = {}
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                base_query['agent_id'] = str(agent['_id'])
        
        # Total transactions
        total_transactions = db.transactions.count_documents(base_query)
        
        # Completed transactions
        completed_query = {**base_query, 'status': 'completed'}
        completed_transactions = db.transactions.count_documents(completed_query)
        
        # Pending transactions
        pending_query = {**base_query, 'status': {'$in': ['pending', 'in_progress']}}
        pending_transactions = db.transactions.count_documents(pending_query)
        
        # Total revenue
        revenue_result = db.transactions.aggregate([
            {'$match': {**base_query, 'status': 'completed'}},
            {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
        ])
        total_revenue = list(revenue_result)
        total_revenue = total_revenue[0]['total'] if total_revenue else 0
        
        # Total commission
        commission_result = db.transactions.aggregate([
            {'$match': {**base_query, 'status': 'completed'}},
            {'$group': {'_id': None, 'total': {'$sum': '$commission'}}}
        ])
        total_commission = list(commission_result)
        total_commission = total_commission[0]['total'] if total_commission else 0
        
        # Monthly revenue (last 12 months)
        twelve_months_ago = datetime.utcnow() - timedelta(days=365)
        monthly_revenue = list(db.transactions.aggregate([
            {
                '$match': {
                    **base_query,
                    'status': 'completed',
                    'created_at': {'$gte': twelve_months_ago}
                }
            },
            {
                '$group': {
                    '_id': {
                        'year': {'$year': '$created_at'},
                        'month': {'$month': '$created_at'}
                    },
                    'revenue': {'$sum': '$amount'},
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'_id.year': 1, '_id.month': 1}}
        ]))
        
        # Transactions by type
        by_type = list(db.transactions.aggregate([
            {'$match': base_query},
            {'$group': {'_id': '$transaction_type', 'count': {'$sum': 1}, 'total': {'$sum': '$amount'}}}
        ]))
        
        return jsonify({
            'success': True,
            'data': {
                'total_transactions': total_transactions,
                'completed_transactions': completed_transactions,
                'pending_transactions': pending_transactions,
                'total_revenue': total_revenue,
                'total_commission': total_commission,
                'monthly_revenue': monthly_revenue,
                'by_type': by_type
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch transaction stats: {str(e)}'
        }), 500
