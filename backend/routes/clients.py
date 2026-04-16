"""
Clients Routes
Handles CRUD operations for client management
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import math

from models.models import ClientModel, UserModel

clients_bp = Blueprint('clients', __name__)


# ============================================
# GET ALL CLIENTS
# ============================================
@clients_bp.route('', methods=['GET'])
@jwt_required()
def get_clients():
    """Get all clients with optional filtering"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        # Check user role
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') not in ['agent', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Permission denied'
            }), 403
        
        # Pagination
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        skip = (page - 1) * limit
        
        # Build query
        query = {}
        
        # Filter by assigned agent (for agents, only show their clients)
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                query['assigned_agent_id'] = str(agent['_id'])
        
        # Filter by client type
        client_type = request.args.get('client_type')
        if client_type:
            query['client_type'] = client_type
        
        # Filter by status
        status = request.args.get('status')
        if status:
            query['status'] = status
        
        # Search by name
        search = request.args.get('search')
        
        # Get total count
        total_count = db.clients.count_documents(query)
        total_pages = math.ceil(total_count / limit) if limit > 0 else 1
        
        # Get clients
        clients_cursor = db.clients.find(query).sort(
            'created_at', -1
        ).skip(skip).limit(limit)
        
        clients = []
        for client in clients_cursor:
            # Get user details
            user_doc = db.users.find_one({'_id': ObjectId(client['user_id'])})
            
            # Apply search filter
            if search and user_doc:
                full_name = f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}".lower()
                email = user_doc.get('email', '').lower()
                if search.lower() not in full_name and search.lower() not in email:
                    continue
            
            client_data = ClientModel.to_dict(client, user_doc)
            
            # Get transaction count for this client
            txn_count = db.transactions.count_documents({'client_id': str(client['_id'])})
            client_data['transaction_count'] = txn_count
            
            clients.append(client_data)
        
        return jsonify({
            'success': True,
            'data': {
                'clients': clients,
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
            'message': f'Failed to fetch clients: {str(e)}'
        }), 500


# ============================================
# GET SINGLE CLIENT
# ============================================
@clients_bp.route('/<client_id>', methods=['GET'])
@jwt_required()
def get_client(client_id):
    """Get a single client by ID"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(client_id):
            return jsonify({
                'success': False,
                'message': 'Invalid client ID'
            }), 400
        
        client = db.clients.find_one({'_id': ObjectId(client_id)})
        
        if not client:
            return jsonify({
                'success': False,
                'message': 'Client not found'
            }), 404
        
        # Check permission
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if not agent or str(agent['_id']) != client.get('assigned_agent_id'):
                # Allow if it's the user's own client profile
                if client.get('user_id') != current_user_id:
                    return jsonify({
                        'success': False,
                        'message': 'Permission denied'
                    }), 403
        elif user.get('role') == 'client':
            if client.get('user_id') != current_user_id:
                return jsonify({
                    'success': False,
                    'message': 'Permission denied'
                }), 403
        
        # Get user details
        user_doc = db.users.find_one({'_id': ObjectId(client['user_id'])})
        client_data = ClientModel.to_dict(client, user_doc)
        
        # Get client's transactions
        from models.models import TransactionModel
        transactions_cursor = db.transactions.find({
            'client_id': client_id
        }).sort('created_at', -1).limit(10)
        
        client_data['transactions'] = [TransactionModel.to_dict(t) for t in transactions_cursor]
        
        # Get assigned agent details
        if client.get('assigned_agent_id') and ObjectId.is_valid(client['assigned_agent_id']):
            agent = db.agents.find_one({'_id': ObjectId(client['assigned_agent_id'])})
            if agent:
                agent_user = db.users.find_one({'_id': ObjectId(agent['user_id'])})
                if agent_user:
                    client_data['assigned_agent'] = {
                        'id': str(agent['_id']),
                        'name': f"{agent_user.get('first_name', '')} {agent_user.get('last_name', '')}".strip(),
                        'email': agent_user.get('email'),
                        'phone': agent_user.get('phone')
                    }
        
        return jsonify({
            'success': True,
            'data': client_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch client: {str(e)}'
        }), 500


# ============================================
# CREATE CLIENT PROFILE
# ============================================
@clients_bp.route('', methods=['POST'])
@jwt_required()
def create_client():
    """Create a client profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        # Determine whose profile to create
        if user.get('role') in ['agent', 'admin'] and data.get('user_id'):
            # Agent/admin creating profile for another user
            target_user_id = data.get('user_id')
        else:
            # User creating their own profile
            target_user_id = current_user_id
        
        # Check if client profile already exists
        existing_client = db.clients.find_one({'user_id': target_user_id})
        if existing_client:
            return jsonify({
                'success': False,
                'message': 'Client profile already exists'
            }), 409
        
        # If agent is creating, set themselves as assigned agent
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                data['assigned_agent_id'] = str(agent['_id'])
        
        # Create client profile
        new_client = ClientModel.create_client(data, target_user_id)
        result = db.clients.insert_one(new_client)
        
        # Get created client
        client = db.clients.find_one({'_id': result.inserted_id})
        user_doc = db.users.find_one({'_id': ObjectId(target_user_id)})
        client_data = ClientModel.to_dict(client, user_doc)
        
        return jsonify({
            'success': True,
            'message': 'Client profile created successfully',
            'data': client_data
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create client profile: {str(e)}'
        }), 500


# ============================================
# UPDATE CLIENT
# ============================================
@clients_bp.route('/<client_id>', methods=['PUT'])
@jwt_required()
def update_client(client_id):
    """Update a client profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(client_id):
            return jsonify({
                'success': False,
                'message': 'Invalid client ID'
            }), 400
        
        client = db.clients.find_one({'_id': ObjectId(client_id)})
        
        if not client:
            return jsonify({
                'success': False,
                'message': 'Client not found'
            }), 404
        
        # Check permission
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        can_edit = False
        
        if user.get('role') == 'admin':
            can_edit = True
        elif user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent and str(agent['_id']) == client.get('assigned_agent_id'):
                can_edit = True
        elif client.get('user_id') == current_user_id:
            can_edit = True
        
        if not can_edit:
            return jsonify({
                'success': False,
                'message': 'Permission denied'
            }), 403
        
        # Build update data
        update_fields = [
            'client_type', 'budget_min', 'budget_max', 'preferred_locations',
            'preferred_property_types', 'requirements', 'status'
        ]
        
        update_data = {k: v for k, v in data.items() if k in update_fields}
        
        # Only admin/agent can update assigned_agent
        if user.get('role') in ['admin', 'agent'] and 'assigned_agent_id' in data:
            update_data['assigned_agent_id'] = data['assigned_agent_id']
        
        update_data['updated_at'] = datetime.utcnow()
        
        # Update client
        db.clients.update_one(
            {'_id': ObjectId(client_id)},
            {'$set': update_data}
        )
        
        # Get updated client
        client = db.clients.find_one({'_id': ObjectId(client_id)})
        user_doc = db.users.find_one({'_id': ObjectId(client['user_id'])})
        client_data = ClientModel.to_dict(client, user_doc)
        
        return jsonify({
            'success': True,
            'message': 'Client profile updated successfully',
            'data': client_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to update client profile: {str(e)}'
        }), 500


# ============================================
# ADD NOTE TO CLIENT
# ============================================
@clients_bp.route('/<client_id>/notes', methods=['POST'])
@jwt_required()
def add_client_note(client_id):
    """Add a note to client profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(client_id):
            return jsonify({
                'success': False,
                'message': 'Invalid client ID'
            }), 400
        
        client = db.clients.find_one({'_id': ObjectId(client_id)})
        
        if not client:
            return jsonify({
                'success': False,
                'message': 'Client not found'
            }), 404
        
        # Check permission (only agent/admin)
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') not in ['agent', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Permission denied'
            }), 403
        
        # Create note
        note = {
            'id': str(ObjectId()),
            'content': data.get('content', ''),
            'author_id': current_user_id,
            'author_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Add note to client
        db.clients.update_one(
            {'_id': ObjectId(client_id)},
            {
                '$push': {'notes': note},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Note added successfully',
            'data': note
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to add note: {str(e)}'
        }), 500


# ============================================
# DELETE CLIENT
# ============================================
@clients_bp.route('/<client_id>', methods=['DELETE'])
@jwt_required()
def delete_client(client_id):
    """Delete a client profile"""
    try:
        current_user_id = get_jwt_identity()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(client_id):
            return jsonify({
                'success': False,
                'message': 'Invalid client ID'
            }), 400
        
        client = db.clients.find_one({'_id': ObjectId(client_id)})
        
        if not client:
            return jsonify({
                'success': False,
                'message': 'Client not found'
            }), 404
        
        # Only admin can delete
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Only admins can delete client profiles'
            }), 403
        
        # Delete client profile
        db.clients.delete_one({'_id': ObjectId(client_id)})
        
        return jsonify({
            'success': True,
            'message': 'Client profile deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete client profile: {str(e)}'
        }), 500


# ============================================
# GET CLIENT STATISTICS
# ============================================
@clients_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_client_stats():
    """Get client statistics for dashboard"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        # Build base query based on role
        base_query = {}
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                base_query['assigned_agent_id'] = str(agent['_id'])
        
        # Total clients
        total_clients = db.clients.count_documents(base_query)
        
        # Active clients
        active_clients = db.clients.count_documents({**base_query, 'status': 'active'})
        
        # Clients by type
        by_type = list(db.clients.aggregate([
            {'$match': base_query},
            {'$group': {'_id': '$client_type', 'count': {'$sum': 1}}}
        ]))
        
        # New clients this month
        from datetime import timedelta
        first_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_this_month = db.clients.count_documents({
            **base_query,
            'created_at': {'$gte': first_of_month}
        })
        
        # Converted clients (has completed transaction)
        converted_clients = db.clients.count_documents({**base_query, 'status': 'converted'})
        
        return jsonify({
            'success': True,
            'data': {
                'total_clients': total_clients,
                'active_clients': active_clients,
                'new_this_month': new_this_month,
                'converted_clients': converted_clients,
                'by_type': by_type
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch client stats: {str(e)}'
        }), 500
