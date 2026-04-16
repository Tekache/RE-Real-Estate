"""
Dashboard Routes
Handles dashboard statistics and analytics
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)


# ============================================
# GET DASHBOARD OVERVIEW
# ============================================
@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    """Get dashboard overview statistics"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        user_role = user.get('role', 'client')
        
        # Build base queries based on role
        property_query = {}
        transaction_query = {}
        client_query = {}
        
        if user_role == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                agent_id = str(agent['_id'])
                property_query['agent_id'] = agent_id
                transaction_query['agent_id'] = agent_id
                client_query['assigned_agent_id'] = agent_id
        
        # Property statistics
        total_properties = db.properties.count_documents(property_query)
        available_properties = db.properties.count_documents({**property_query, 'status': 'available'})
        sold_properties = db.properties.count_documents({**property_query, 'status': 'sold'})
        rented_properties = db.properties.count_documents({**property_query, 'status': 'rented'})
        
        # Transaction statistics
        total_transactions = db.transactions.count_documents(transaction_query)
        pending_transactions = db.transactions.count_documents({**transaction_query, 'status': 'pending'})
        completed_transactions = db.transactions.count_documents({**transaction_query, 'status': 'completed'})
        
        # Revenue
        revenue_result = list(db.transactions.aggregate([
            {'$match': {**transaction_query, 'status': 'completed'}},
            {'$group': {'_id': None, 'total': {'$sum': '$amount'}, 'commission': {'$sum': '$commission'}}}
        ]))
        total_revenue = revenue_result[0]['total'] if revenue_result else 0
        total_commission = revenue_result[0]['commission'] if revenue_result else 0
        
        # Client statistics
        total_clients = db.clients.count_documents(client_query)
        active_clients = db.clients.count_documents({**client_query, 'status': 'active'})
        
        # Agent statistics (admin only)
        agent_stats = None
        if user_role == 'admin':
            total_agents = db.agents.count_documents({})
            verified_agents = db.agents.count_documents({'is_verified': True})
            agent_stats = {
                'total_agents': total_agents,
                'verified_agents': verified_agents
            }
        
        # Recent activity
        recent_properties = list(db.properties.find(property_query).sort('created_at', -1).limit(5))
        recent_transactions = list(db.transactions.find(transaction_query).sort('created_at', -1).limit(5))
        
        # Format recent items
        from models.models import PropertyModel, TransactionModel
        recent_properties_data = [PropertyModel.to_dict(p) for p in recent_properties]
        recent_transactions_data = [TransactionModel.to_dict(t) for t in recent_transactions]
        
        return jsonify({
            'success': True,
            'data': {
                'properties': {
                    'total': total_properties,
                    'available': available_properties,
                    'sold': sold_properties,
                    'rented': rented_properties
                },
                'transactions': {
                    'total': total_transactions,
                    'pending': pending_transactions,
                    'completed': completed_transactions
                },
                'revenue': {
                    'total': total_revenue,
                    'commission': total_commission
                },
                'clients': {
                    'total': total_clients,
                    'active': active_clients
                },
                'agents': agent_stats,
                'recent': {
                    'properties': recent_properties_data,
                    'transactions': recent_transactions_data
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch dashboard overview: {str(e)}'
        }), 500


# ============================================
# GET REVENUE ANALYTICS
# ============================================
@dashboard_bp.route('/analytics/revenue', methods=['GET'])
@jwt_required()
def get_revenue_analytics():
    """Get revenue analytics with time series data"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        # Build base query
        base_query = {'status': 'completed'}
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                base_query['agent_id'] = str(agent['_id'])
        
        # Time range (default last 12 months)
        months = int(request.args.get('months', 12))
        start_date = datetime.utcnow() - timedelta(days=months * 30)
        base_query['created_at'] = {'$gte': start_date}
        
        # Monthly revenue
        monthly_data = list(db.transactions.aggregate([
            {'$match': base_query},
            {
                '$group': {
                    '_id': {
                        'year': {'$year': '$created_at'},
                        'month': {'$month': '$created_at'}
                    },
                    'revenue': {'$sum': '$amount'},
                    'commission': {'$sum': '$commission'},
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'_id.year': 1, '_id.month': 1}}
        ]))
        
        # Format monthly data
        formatted_monthly = []
        for item in monthly_data:
            month_name = datetime(item['_id']['year'], item['_id']['month'], 1).strftime('%b %Y')
            formatted_monthly.append({
                'month': month_name,
                'revenue': item['revenue'],
                'commission': item['commission'],
                'transactions': item['count']
            })
        
        # Revenue by property type
        by_property_type = list(db.transactions.aggregate([
            {'$match': base_query},
            {
                '$lookup': {
                    'from': 'properties',
                    'localField': 'property_id',
                    'foreignField': '_id',
                    'as': 'property'
                }
            },
            {'$unwind': {'path': '$property', 'preserveNullAndEmptyArrays': True}},
            {
                '$group': {
                    '_id': '$property.property_type',
                    'revenue': {'$sum': '$amount'},
                    'count': {'$sum': 1}
                }
            }
        ]))
        
        # Revenue by transaction type
        by_transaction_type = list(db.transactions.aggregate([
            {'$match': base_query},
            {
                '$group': {
                    '_id': '$transaction_type',
                    'revenue': {'$sum': '$amount'},
                    'count': {'$sum': 1}
                }
            }
        ]))
        
        return jsonify({
            'success': True,
            'data': {
                'monthly': formatted_monthly,
                'by_property_type': by_property_type,
                'by_transaction_type': by_transaction_type
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch revenue analytics: {str(e)}'
        }), 500


# ============================================
# GET PROPERTY ANALYTICS
# ============================================
@dashboard_bp.route('/analytics/properties', methods=['GET'])
@jwt_required()
def get_property_analytics():
    """Get property analytics"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        # Build base query
        base_query = {}
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                base_query['agent_id'] = str(agent['_id'])
        
        # Properties by type
        by_type = list(db.properties.aggregate([
            {'$match': base_query},
            {'$group': {'_id': '$property_type', 'count': {'$sum': 1}}}
        ]))
        
        # Properties by status
        by_status = list(db.properties.aggregate([
            {'$match': base_query},
            {'$group': {'_id': '$status', 'count': {'$sum': 1}}}
        ]))
        
        # Properties by listing type
        by_listing_type = list(db.properties.aggregate([
            {'$match': base_query},
            {'$group': {'_id': '$listing_type', 'count': {'$sum': 1}}}
        ]))
        
        # Average price by type
        avg_price_by_type = list(db.properties.aggregate([
            {'$match': base_query},
            {'$group': {'_id': '$property_type', 'avg_price': {'$avg': '$price'}}}
        ]))
        
        # Properties by city (top 10)
        by_city = list(db.properties.aggregate([
            {'$match': base_query},
            {'$group': {'_id': '$address.city', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]))
        
        # Most viewed properties
        most_viewed = list(db.properties.find(base_query).sort('views', -1).limit(5))
        from models.models import PropertyModel
        most_viewed_data = [PropertyModel.to_dict(p) for p in most_viewed]
        
        # New listings (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_listings = db.properties.count_documents({
            **base_query,
            'created_at': {'$gte': thirty_days_ago}
        })
        
        return jsonify({
            'success': True,
            'data': {
                'by_type': by_type,
                'by_status': by_status,
                'by_listing_type': by_listing_type,
                'avg_price_by_type': avg_price_by_type,
                'by_city': by_city,
                'most_viewed': most_viewed_data,
                'new_listings_30d': new_listings
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch property analytics: {str(e)}'
        }), 500


# ============================================
# GET PERFORMANCE METRICS
# ============================================
@dashboard_bp.route('/analytics/performance', methods=['GET'])
@jwt_required()
def get_performance_metrics():
    """Get agent/system performance metrics"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        # Time ranges
        now = datetime.utcnow()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = this_month_start - timedelta(seconds=1)
        
        # Build base query
        agent_query = {}
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                agent_query['agent_id'] = str(agent['_id'])
        
        # This month stats
        this_month_transactions = db.transactions.count_documents({
            **agent_query,
            'created_at': {'$gte': this_month_start},
            'status': 'completed'
        })
        
        this_month_revenue_result = list(db.transactions.aggregate([
            {
                '$match': {
                    **agent_query,
                    'created_at': {'$gte': this_month_start},
                    'status': 'completed'
                }
            },
            {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
        ]))
        this_month_revenue = this_month_revenue_result[0]['total'] if this_month_revenue_result else 0
        
        # Last month stats
        last_month_transactions = db.transactions.count_documents({
            **agent_query,
            'created_at': {'$gte': last_month_start, '$lte': last_month_end},
            'status': 'completed'
        })
        
        last_month_revenue_result = list(db.transactions.aggregate([
            {
                '$match': {
                    **agent_query,
                    'created_at': {'$gte': last_month_start, '$lte': last_month_end},
                    'status': 'completed'
                }
            },
            {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
        ]))
        last_month_revenue = last_month_revenue_result[0]['total'] if last_month_revenue_result else 0
        
        # Calculate growth
        transaction_growth = 0
        if last_month_transactions > 0:
            transaction_growth = ((this_month_transactions - last_month_transactions) / last_month_transactions) * 100
        
        revenue_growth = 0
        if last_month_revenue > 0:
            revenue_growth = ((this_month_revenue - last_month_revenue) / last_month_revenue) * 100
        
        # Conversion rate (inquiries to transactions)
        total_inquiries = db.inquiries.count_documents({})
        total_conversions = db.transactions.count_documents({'status': 'completed'})
        conversion_rate = (total_conversions / total_inquiries * 100) if total_inquiries > 0 else 0
        
        # Average deal size
        avg_deal_result = list(db.transactions.aggregate([
            {'$match': {**agent_query, 'status': 'completed'}},
            {'$group': {'_id': None, 'avg': {'$avg': '$amount'}}}
        ]))
        avg_deal_size = avg_deal_result[0].get('avg') if avg_deal_result else 0
        avg_deal_size = round(avg_deal_size or 0, 2)
        
        # Average time to close (in days)
        avg_close_time_result = list(db.transactions.aggregate([
            {
                '$match': {
                    **agent_query,
                    'status': 'completed',
                    'closing_date': {'$exists': True},
                    'created_at': {'$exists': True}
                }
            },
            {
                '$project': {
                    'days': {
                        '$divide': [
                            {'$subtract': ['$closing_date', '$created_at']},
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {'$group': {'_id': None, 'avg': {'$avg': '$days'}}}
        ]))
        avg_close_time = avg_close_time_result[0].get('avg') if avg_close_time_result else 0
        avg_close_time = round(avg_close_time or 0, 1)
        
        return jsonify({
            'success': True,
            'data': {
                'this_month': {
                    'transactions': this_month_transactions,
                    'revenue': this_month_revenue
                },
                'last_month': {
                    'transactions': last_month_transactions,
                    'revenue': last_month_revenue
                },
                'growth': {
                    'transactions': round(transaction_growth, 1),
                    'revenue': round(revenue_growth, 1)
                },
                'metrics': {
                    'conversion_rate': round(conversion_rate, 2),
                    'avg_deal_size': avg_deal_size,
                    'avg_close_time_days': avg_close_time
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch performance metrics: {str(e)}'
        }), 500


# ============================================
# GET RECENT ACTIVITY
# ============================================
@dashboard_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """Get recent activity feed"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        limit = int(request.args.get('limit', 20))
        
        activities = []
        
        # Build base queries
        property_query = {}
        transaction_query = {}
        inquiry_query = {}
        
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                agent_id = str(agent['_id'])
                property_query['agent_id'] = agent_id
                transaction_query['agent_id'] = agent_id
                inquiry_query['agent_id'] = agent_id
        
        # Recent properties
        recent_properties = list(db.properties.find(property_query).sort('created_at', -1).limit(limit))
        for prop in recent_properties:
            activities.append({
                'type': 'property',
                'action': 'created',
                'title': f"New property listed: {prop.get('title')}",
                'timestamp': prop.get('created_at').isoformat() if prop.get('created_at') else None,
                'data': {'id': str(prop['_id']), 'title': prop.get('title')}
            })
        
        # Recent transactions
        recent_transactions = list(db.transactions.find(transaction_query).sort('created_at', -1).limit(limit))
        for txn in recent_transactions:
            action_text = 'New transaction' if txn.get('status') == 'pending' else f"Transaction {txn.get('status')}"
            activities.append({
                'type': 'transaction',
                'action': txn.get('status'),
                'title': f"{action_text}: ${txn.get('amount', 0):,.2f}",
                'timestamp': txn.get('created_at').isoformat() if txn.get('created_at') else None,
                'data': {'id': str(txn['_id']), 'amount': txn.get('amount')}
            })
        
        # Recent inquiries
        recent_inquiries = list(db.inquiries.find(inquiry_query).sort('created_at', -1).limit(limit))
        for inq in recent_inquiries:
            activities.append({
                'type': 'inquiry',
                'action': 'received',
                'title': f"New inquiry from {inq.get('name')}",
                'timestamp': inq.get('created_at').isoformat() if inq.get('created_at') else None,
                'data': {'id': str(inq['_id']), 'name': inq.get('name')}
            })
        
        # Sort by timestamp and limit
        activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        activities = activities[:limit]
        
        return jsonify({
            'success': True,
            'data': activities
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch activity: {str(e)}'
        }), 500
