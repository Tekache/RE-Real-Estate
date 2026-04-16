"""
Contact Routes
Handles contact form submissions and inquiries
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import re

from models.models import InquiryModel

contact_bp = Blueprint('contact', __name__)

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


# ============================================
# SUBMIT CONTACT FORM
# ============================================
@contact_bp.route('/submit', methods=['POST'])
def submit_contact():
    """Submit a contact form inquiry"""
    try:
        data = request.get_json()
        db = current_app.db
        
        # Validate required fields
        required_fields = ['name', 'email', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.title()} is required'
                }), 400
        
        # Validate email
        if not EMAIL_REGEX.match(data.get('email', '')):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Create inquiry
        inquiry = InquiryModel.create_inquiry(data)
        result = db.inquiries.insert_one(inquiry)
        
        # Get created inquiry
        created_inquiry = db.inquiries.find_one({'_id': result.inserted_id})
        inquiry_data = InquiryModel.to_dict(created_inquiry)
        
        return jsonify({
            'success': True,
            'message': 'Thank you for your message! We will get back to you soon.',
            'data': inquiry_data
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to submit inquiry: {str(e)}'
        }), 500


# ============================================
# SUBMIT PROPERTY INQUIRY
# ============================================
@contact_bp.route('/property-inquiry', methods=['POST'])
def submit_property_inquiry():
    """Submit an inquiry about a specific property"""
    try:
        data = request.get_json()
        db = current_app.db
        
        # Validate required fields
        required_fields = ['name', 'email', 'property_id', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        # Validate email
        if not EMAIL_REGEX.match(data.get('email', '')):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validate property exists
        property_id = data.get('property_id')
        if not ObjectId.is_valid(property_id):
            return jsonify({
                'success': False,
                'message': 'Invalid property ID'
            }), 400
        
        property_doc = db.properties.find_one({'_id': ObjectId(property_id)})
        if not property_doc:
            return jsonify({
                'success': False,
                'message': 'Property not found'
            }), 404
        
        # Set inquiry type and agent
        data['inquiry_type'] = 'property'
        if property_doc.get('agent_id'):
            data['agent_id'] = property_doc['agent_id']
        
        # Create inquiry
        inquiry = InquiryModel.create_inquiry(data)
        result = db.inquiries.insert_one(inquiry)
        
        return jsonify({
            'success': True,
            'message': 'Your inquiry has been sent to the listing agent. They will contact you soon.'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to submit inquiry: {str(e)}'
        }), 500


# ============================================
# SUBMIT AGENT INQUIRY
# ============================================
@contact_bp.route('/agent-inquiry', methods=['POST'])
def submit_agent_inquiry():
    """Submit an inquiry to contact a specific agent"""
    try:
        data = request.get_json()
        db = current_app.db
        
        # Validate required fields
        required_fields = ['name', 'email', 'agent_id', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        # Validate email
        if not EMAIL_REGEX.match(data.get('email', '')):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validate agent exists
        agent_id = data.get('agent_id')
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
        
        # Set inquiry type
        data['inquiry_type'] = 'agent'
        
        # Create inquiry
        inquiry = InquiryModel.create_inquiry(data)
        result = db.inquiries.insert_one(inquiry)
        
        return jsonify({
            'success': True,
            'message': 'Your message has been sent to the agent. They will contact you soon.'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to submit inquiry: {str(e)}'
        }), 500


# ============================================
# GET ALL INQUIRIES (Admin/Agent)
# ============================================
@contact_bp.route('/inquiries', methods=['GET'])
@jwt_required()
def get_inquiries():
    """Get all inquiries (filtered by agent for agent users)"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db
        
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
        
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                query['agent_id'] = str(agent['_id'])
        
        # Filter by status
        status = request.args.get('status')
        if status:
            query['status'] = status
        
        # Filter by type
        inquiry_type = request.args.get('type')
        if inquiry_type:
            query['inquiry_type'] = inquiry_type
        
        # Get total count
        import math
        total_count = db.inquiries.count_documents(query)
        total_pages = math.ceil(total_count / limit) if limit > 0 else 1
        
        # Get inquiries
        inquiries_cursor = db.inquiries.find(query).sort('created_at', -1).skip(skip).limit(limit)
        
        inquiries = []
        for inq in inquiries_cursor:
            inq_data = InquiryModel.to_dict(inq)
            
            # Get property details if exists
            if inq.get('property_id') and ObjectId.is_valid(inq['property_id']):
                property_doc = db.properties.find_one({'_id': ObjectId(inq['property_id'])})
                if property_doc:
                    inq_data['property'] = {
                        'id': str(property_doc['_id']),
                        'title': property_doc.get('title')
                    }
            
            inquiries.append(inq_data)
        
        return jsonify({
            'success': True,
            'data': {
                'inquiries': inquiries,
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
            'message': f'Failed to fetch inquiries: {str(e)}'
        }), 500


# ============================================
# UPDATE INQUIRY STATUS
# ============================================
@contact_bp.route('/inquiries/<inquiry_id>', methods=['PUT'])
@jwt_required()
def update_inquiry(inquiry_id):
    """Update inquiry status"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(inquiry_id):
            return jsonify({
                'success': False,
                'message': 'Invalid inquiry ID'
            }), 400
        
        inquiry = db.inquiries.find_one({'_id': ObjectId(inquiry_id)})
        
        if not inquiry:
            return jsonify({
                'success': False,
                'message': 'Inquiry not found'
            }), 404
        
        # Check permission
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if not agent or str(agent['_id']) != inquiry.get('agent_id'):
                return jsonify({
                    'success': False,
                    'message': 'Permission denied'
                }), 403
        elif user.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Permission denied'
            }), 403
        
        # Update status
        new_status = data.get('status')
        if new_status not in ['new', 'read', 'responded', 'closed']:
            return jsonify({
                'success': False,
                'message': 'Invalid status'
            }), 400
        
        db.inquiries.update_one(
            {'_id': ObjectId(inquiry_id)},
            {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({
            'success': True,
            'message': 'Inquiry status updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to update inquiry: {str(e)}'
        }), 500


# ============================================
# DELETE INQUIRY
# ============================================
@contact_bp.route('/inquiries/<inquiry_id>', methods=['DELETE'])
@jwt_required()
def delete_inquiry(inquiry_id):
    """Delete an inquiry"""
    try:
        current_user_id = get_jwt_identity()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(inquiry_id):
            return jsonify({
                'success': False,
                'message': 'Invalid inquiry ID'
            }), 400
        
        inquiry = db.inquiries.find_one({'_id': ObjectId(inquiry_id)})
        
        if not inquiry:
            return jsonify({
                'success': False,
                'message': 'Inquiry not found'
            }), 404
        
        # Only admin can delete
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Only admins can delete inquiries'
            }), 403
        
        # Delete inquiry
        db.inquiries.delete_one({'_id': ObjectId(inquiry_id)})
        
        return jsonify({
            'success': True,
            'message': 'Inquiry deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete inquiry: {str(e)}'
        }), 500
