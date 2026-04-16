"""
Authentication Routes
Handles user registration, login, logout, and token management
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required, 
    get_jwt_identity,
    get_jwt
)
from bson import ObjectId
from datetime import datetime
import re

from models.models import UserModel, AgentModel, ClientModel

auth_bp = Blueprint('auth', __name__)

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
AFRICAN_AGENT_AVATARS = [
    "https://images.unsplash.com/photo-1627161683077-e34782c24d81?w=400&q=80",
    "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&q=80",
    "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&q=80",
    "https://images.unsplash.com/photo-1595956553066-fe24a8c33395?w=400&q=80",
    "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&q=80",
]

def validate_email(email):
    """Validate email format"""
    return bool(EMAIL_REGEX.match(email))

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Valid"


def normalize_role(raw_role):
    role = (raw_role or 'client').strip().lower()
    return role if role in ['admin', 'agent', 'client'] else 'client'


def ensure_user_profile(db, user_doc):
    """Ensure role-based profile exists for the user."""
    user_id = str(user_doc['_id'])
    role = user_doc.get('role', 'client')

    if role == 'agent':
        existing_agent = db.agents.find_one({'user_id': user_id})
        if not existing_agent:
            seeded_avatar = user_doc.get('avatar') or AFRICAN_AGENT_AVATARS[hash(user_id) % len(AFRICAN_AGENT_AVATARS)]
            db.users.update_one({'_id': user_doc['_id']}, {'$set': {'avatar': seeded_avatar}})
            agent_payload = {
                'license_number': f'PENDING-{user_id[-6:].upper()}',
                'agency': 'Independent Agent',
                'specializations': ['residential'],
                'experience_years': 0,
                'languages': ['English'],
                'bio': 'Newly registered real estate agent.'
            }
            db.agents.insert_one(AgentModel.create_agent(agent_payload, user_id))
    elif role == 'client':
        existing_client = db.clients.find_one({'user_id': user_id})
        if not existing_client:
            client_payload = {
                'client_type': 'buyer',
                'source': 'website'
            }
            db.clients.insert_one(ClientModel.create_client(client_payload, user_id))


# ============================================
# REGISTER
# ============================================
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        # Validate email format
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validate password strength
        is_valid, password_message = validate_password(password)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': password_message
            }), 400
        
        # Check if user already exists
        db = current_app.db
        existing_user = db.users.find_one({'email': email})
        
        if existing_user:
            return jsonify({
                'success': False,
                'message': 'An account with this email already exists'
            }), 409
        
        # Normalize role and create new user
        data['role'] = normalize_role(data.get('role'))
        new_user = UserModel.create_user(data)
        result = db.users.insert_one(new_user)

        # Ensure corresponding role profile exists
        created_user = db.users.find_one({'_id': result.inserted_id})
        ensure_user_profile(db, created_user)
        
        # Generate tokens
        user_id = str(result.inserted_id)
        access_token = create_access_token(identity=user_id)
        refresh_token = create_refresh_token(identity=user_id)
        
        # Get user data
        user = db.users.find_one({'_id': result.inserted_id})
        user_data = UserModel.to_dict(user)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'data': {
                'user': user_data,
                'access_token': access_token,
                'refresh_token': refresh_token
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Registration failed: {str(e)}'
        }), 500


# ============================================
# LOGIN
# ============================================
@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return tokens"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # Find user by email
        db = current_app.db
        user = db.users.find_one({'email': email})
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
        
        # Verify password
        if not UserModel.verify_password(user.get('password'), password):
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
        
        # Check if user is active
        if not user.get('is_active', True):
            return jsonify({
                'success': False,
                'message': 'Your account has been deactivated. Please contact support.'
            }), 403
        
        # Update last login
        db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.utcnow()}}
        )

        # Backfill missing role profile for existing records
        ensure_user_profile(db, user)
        
        # Generate tokens
        user_id = str(user['_id'])
        access_token = create_access_token(identity=user_id)
        refresh_token = create_refresh_token(identity=user_id)
        
        # Get updated user data
        user = db.users.find_one({'_id': user['_id']})
        user_data = UserModel.to_dict(user)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'user': user_data,
                'access_token': access_token,
                'refresh_token': refresh_token
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Login failed: {str(e)}'
        }), 500


# ============================================
# REFRESH TOKEN
# ============================================
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user still exists and is active
        db = current_app.db
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        if not user.get('is_active', True):
            return jsonify({
                'success': False,
                'message': 'Account is deactivated'
            }), 403
        
        # Generate new access token
        access_token = create_access_token(identity=current_user_id)
        
        return jsonify({
            'success': True,
            'message': 'Token refreshed successfully',
            'data': {
                'access_token': access_token
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Token refresh failed: {str(e)}'
        }), 500


# ============================================
# GET CURRENT USER
# ============================================
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        
        db = current_app.db
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        user_data = UserModel.to_dict(user)
        
        return jsonify({
            'success': True,
            'data': user_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get user: {str(e)}'
        }), 500


# ============================================
# UPDATE PROFILE
# ============================================
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user's profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Fields that can be updated
        allowed_fields = ['first_name', 'last_name', 'phone', 'avatar', 'preferences']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        update_data['updated_at'] = datetime.utcnow()
        
        db = current_app.db
        result = db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get updated user
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        user_data = UserModel.to_dict(user)
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'data': user_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Profile update failed: {str(e)}'
        }), 500


# ============================================
# CHANGE PASSWORD
# ============================================
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user's password"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            return jsonify({
                'success': False,
                'message': 'Current password and new password are required'
            }), 400
        
        # Validate new password
        is_valid, password_message = validate_password(new_password)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': password_message
            }), 400
        
        db = current_app.db
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Verify current password
        if not UserModel.verify_password(user.get('password'), current_password):
            return jsonify({
                'success': False,
                'message': 'Current password is incorrect'
            }), 401
        
        # Update password
        from werkzeug.security import generate_password_hash
        hashed_password = generate_password_hash(new_password)
        
        db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {
                'password': hashed_password,
                'updated_at': datetime.utcnow()
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Password change failed: {str(e)}'
        }), 500


# ============================================
# LOGOUT (Blacklist token - optional)
# ============================================
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens)"""
    # In a production app, you might want to blacklist the token
    # For now, we just return success and let the client handle token removal
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200
