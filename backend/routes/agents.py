"""
Agents Routes
Handles CRUD operations for real estate agents
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import math

from models.models import AgentModel, UserModel

agents_bp = Blueprint('agents', __name__)


# ============================================
# GET ALL AGENTS
# ============================================
@agents_bp.route('', methods=['GET'])
def get_agents():
    """Get all agents with optional filtering and pagination"""
    try:
        db = current_app.db
        
        # Pagination
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 12))
        skip = (page - 1) * limit
        
        # Build query
        query = {}
        
        # Filter by specialization
        specialization = request.args.get('specialization')
        if specialization:
            query['specializations'] = {'$in': [specialization]}
        
        # Filter by verified status
        verified = request.args.get('verified')
        if verified == 'true':
            query['is_verified'] = True
        
        # Filter by featured
        featured = request.args.get('featured')
        if featured == 'true':
            query['is_featured'] = True
        
        # Search by name
        search = request.args.get('search')
        
        # Get total count
        total_count = db.agents.count_documents(query)
        total_pages = math.ceil(total_count / limit) if limit > 0 else 1
        
        # Get agents
        agents_cursor = db.agents.find(query).sort(
            'stats.average_rating', -1
        ).skip(skip).limit(limit)
        
        agents = []
        for agent in agents_cursor:
            # Get user details
            user = db.users.find_one({'_id': ObjectId(agent['user_id'])})
            
            # Apply search filter on user name
            if search:
                full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".lower()
                if search.lower() not in full_name:
                    continue
            
            agent_data = AgentModel.to_dict(agent, user)
            
            # Get property count for this agent
            property_count = db.properties.count_documents({
                'agent_id': str(agent['_id']),
                'status': 'available'
            })
            agent_data['active_listings'] = property_count
            
            agents.append(agent_data)
        
        return jsonify({
            'success': True,
            'data': {
                'agents': agents,
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
            'message': f'Failed to fetch agents: {str(e)}'
        }), 500


# ============================================
# GET SINGLE AGENT
# ============================================
@agents_bp.route('/<agent_id>', methods=['GET'])
def get_agent(agent_id):
    """Get a single agent by ID"""
    try:
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(agent_id):
            return jsonify({
                'success': False,
                'message': 'Invalid agent ID'
            }), 400
        
        agent = db.agents.find_one({'_id': ObjectId(agent_id)})
        
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not found'
            }), 404
        
        # Get user details
        user = db.users.find_one({'_id': ObjectId(agent['user_id'])})
        agent_data = AgentModel.to_dict(agent, user)
        
        # Get agent's properties
        properties_cursor = db.properties.find({
            'agent_id': agent_id,
            'status': 'available'
        }).limit(10)
        
        from models.models import PropertyModel
        agent_data['properties'] = [PropertyModel.to_dict(p) for p in properties_cursor]
        agent_data['active_listings'] = db.properties.count_documents({
            'agent_id': agent_id,
            'status': 'available'
        })
        
        return jsonify({
            'success': True,
            'data': agent_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch agent: {str(e)}'
        }), 500


# ============================================
# CREATE AGENT PROFILE
# ============================================
@agents_bp.route('', methods=['POST'])
@jwt_required()
def create_agent():
    """Create an agent profile for current user"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        # Check if agent profile already exists
        existing_agent = db.agents.find_one({'user_id': current_user_id})
        if existing_agent:
            return jsonify({
                'success': False,
                'message': 'Agent profile already exists'
            }), 409
        
        # Validate required fields
        if not data.get('license_number'):
            return jsonify({
                'success': False,
                'message': 'License number is required'
            }), 400
        
        # Create agent profile
        new_agent = AgentModel.create_agent(data, current_user_id)
        result = db.agents.insert_one(new_agent)
        
        # Update user role to agent
        db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {'role': 'agent', 'updated_at': datetime.utcnow()}}
        )
        
        # Get created agent with user details
        agent = db.agents.find_one({'_id': result.inserted_id})
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        agent_data = AgentModel.to_dict(agent, user)
        
        return jsonify({
            'success': True,
            'message': 'Agent profile created successfully',
            'data': agent_data
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create agent profile: {str(e)}'
        }), 500


# ============================================
# UPDATE AGENT PROFILE
# ============================================
@agents_bp.route('/<agent_id>', methods=['PUT'])
@jwt_required()
def update_agent(agent_id):
    """Update an agent profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(agent_id):
            return jsonify({
                'success': False,
                'message': 'Invalid agent ID'
            }), 400
        
        agent = db.agents.find_one({'_id': ObjectId(agent_id)})
        
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not found'
            }), 404
        
        # Check permission
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if agent['user_id'] != current_user_id and user.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'You can only update your own profile'
            }), 403
        
        # Build update data
        update_fields = [
            'license_number', 'agency', 'specializations', 'experience_years',
            'bio', 'languages', 'certifications', 'social_media', 'availability'
        ]
        
        update_data = {k: v for k, v in data.items() if k in update_fields}
        update_data['updated_at'] = datetime.utcnow()
        
        # Only admin can update these fields
        if user.get('role') == 'admin':
            if 'is_verified' in data:
                update_data['is_verified'] = data['is_verified']
            if 'is_featured' in data:
                update_data['is_featured'] = data['is_featured']
        
        # Update agent
        db.agents.update_one(
            {'_id': ObjectId(agent_id)},
            {'$set': update_data}
        )
        
        # Get updated agent
        agent = db.agents.find_one({'_id': ObjectId(agent_id)})
        user_doc = db.users.find_one({'_id': ObjectId(agent['user_id'])})
        agent_data = AgentModel.to_dict(agent, user_doc)
        
        return jsonify({
            'success': True,
            'message': 'Agent profile updated successfully',
            'data': agent_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to update agent profile: {str(e)}'
        }), 500


# ============================================
# DELETE AGENT PROFILE
# ============================================
@agents_bp.route('/<agent_id>', methods=['DELETE'])
@jwt_required()
def delete_agent(agent_id):
    """Delete an agent profile"""
    try:
        current_user_id = get_jwt_identity()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(agent_id):
            return jsonify({
                'success': False,
                'message': 'Invalid agent ID'
            }), 400
        
        agent = db.agents.find_one({'_id': ObjectId(agent_id)})
        
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not found'
            }), 404
        
        # Check permission (only admin can delete)
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Only admins can delete agent profiles'
            }), 403
        
        # Delete agent profile
        db.agents.delete_one({'_id': ObjectId(agent_id)})
        
        # Update user role back to client
        db.users.update_one(
            {'_id': ObjectId(agent['user_id'])},
            {'$set': {'role': 'client', 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({
            'success': True,
            'message': 'Agent profile deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete agent profile: {str(e)}'
        }), 500


# ============================================
# GET FEATURED AGENTS
# ============================================
@agents_bp.route('/featured', methods=['GET'])
def get_featured_agents():
    """Get featured agents for homepage"""
    try:
        db = current_app.db
        limit = int(request.args.get('limit', 4))
        
        agents_cursor = db.agents.find({
            'is_featured': True,
            'is_verified': True
        }).sort('stats.average_rating', -1).limit(limit)
        
        agents = []
        for agent in agents_cursor:
            user = db.users.find_one({'_id': ObjectId(agent['user_id'])})
            agent_data = AgentModel.to_dict(agent, user)
            
            # Get property count
            property_count = db.properties.count_documents({
                'agent_id': str(agent['_id']),
                'status': 'available'
            })
            agent_data['active_listings'] = property_count
            
            agents.append(agent_data)
        
        return jsonify({
            'success': True,
            'data': agents
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch featured agents: {str(e)}'
        }), 500


# ============================================
# ADD AGENT REVIEW
# ============================================
@agents_bp.route('/<agent_id>/review', methods=['POST'])
@jwt_required()
def add_agent_review(agent_id):
    """Add a review for an agent"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(agent_id):
            return jsonify({
                'success': False,
                'message': 'Invalid agent ID'
            }), 400
        
        agent = db.agents.find_one({'_id': ObjectId(agent_id)})
        
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not found'
            }), 404
        
        # Validate rating
        rating = data.get('rating')
        if not rating or not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            return jsonify({
                'success': False,
                'message': 'Rating must be between 1 and 5'
            }), 400
        
        # Create review
        review = {
            'user_id': current_user_id,
            'agent_id': agent_id,
            'rating': rating,
            'comment': data.get('comment', ''),
            'created_at': datetime.utcnow()
        }
        
        db.reviews.insert_one(review)
        
        # Update agent stats
        current_stats = agent.get('stats', {})
        total_reviews = current_stats.get('total_reviews', 0) + 1
        current_avg = current_stats.get('average_rating', 0)
        new_avg = ((current_avg * (total_reviews - 1)) + rating) / total_reviews
        
        db.agents.update_one(
            {'_id': ObjectId(agent_id)},
            {'$set': {
                'stats.average_rating': round(new_avg, 2),
                'stats.total_reviews': total_reviews
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Review added successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to add review: {str(e)}'
        }), 500
