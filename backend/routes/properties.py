"""
Properties Routes
Handles CRUD operations for property listings
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import math
import base64

from models.models import PropertyModel

properties_bp = Blueprint('properties', __name__)


# ============================================
# GET ALL PROPERTIES (with filtering & pagination)
# ============================================
@properties_bp.route('', methods=['GET'])
def get_properties():
    """Get all properties with optional filtering and pagination"""
    try:
        db = current_app.db
        
        # Pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 12))
        skip = (page - 1) * limit
        
        # Build filter query
        query = {}
        
        # Filter by property type
        property_type = request.args.get('property_type') or request.args.get('propertyType')
        if property_type and property_type != 'all':
            query['property_type'] = property_type
        
        # Filter by listing type (sale/rent)
        listing_type = request.args.get('listing_type') or request.args.get('listingType')
        if listing_type and listing_type != 'all':
            query['listing_type'] = listing_type
        
        # Filter by status
        status = request.args.get('status')
        if status:
            if status != 'all':
                query['status'] = status
        else:
            # By default, show only available properties
            query['status'] = 'available'
        
        # Filter by price range
        min_price = request.args.get('min_price') or request.args.get('minPrice')
        max_price = request.args.get('max_price') or request.args.get('maxPrice')
        if min_price or max_price:
            query['price'] = {}
            if min_price:
                query['price']['$gte'] = float(min_price)
            if max_price:
                query['price']['$lte'] = float(max_price)
        
        # Filter by bedrooms
        bedrooms = request.args.get('bedrooms')
        if bedrooms and bedrooms != 'any':
            if bedrooms.endswith('+'):
                query['features.bedrooms'] = {'$gte': 5}
            else:
                query['features.bedrooms'] = {'$gte': int(bedrooms)}
        
        # Filter by bathrooms
        bathrooms = request.args.get('bathrooms')
        if bathrooms and bathrooms != 'any':
            if bathrooms.endswith('+'):
                query['features.bathrooms'] = {'$gte': 4}
            else:
                query['features.bathrooms'] = {'$gte': int(bathrooms)}
        
        # Filter by location (city)
        city = request.args.get('city') or request.args.get('location')
        if city:
            query['address.city'] = {'$regex': city, '$options': 'i'}
        
        # Filter by state
        state = request.args.get('state')
        if state:
            query['address.state'] = {'$regex': state, '$options': 'i'}
        
        # Search in title and description
        search = request.args.get('search')
        if search:
            query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}},
                {'address.city': {'$regex': search, '$options': 'i'}},
                {'address.state': {'$regex': search, '$options': 'i'}}
            ]
        
        # Filter by featured
        featured = request.args.get('featured')
        if featured == 'true':
            query['featured'] = True
        
        # Filter by agent
        agent_id = request.args.get('agent_id')
        if agent_id:
            query['agent_id'] = agent_id
        
        # Sorting
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = -1 if request.args.get('sort_order', 'desc') == 'desc' else 1
        
        sort_map = {
            'created_at': 'created_at',
            'price': 'price',
            'price_low': 'price',
            'price_high': 'price',
            'newest': 'created_at',
            'views': 'views',
            'favorites': 'favorites'
        }
        
        sort_field = sort_map.get(sort_by, 'created_at')
        if sort_by == 'price_low':
            sort_order = 1
        elif sort_by == 'price_high':
            sort_order = -1
        
        # Get total count for pagination
        total_count = db.properties.count_documents(query)
        total_pages = math.ceil(total_count / limit)
        
        # Get properties
        properties_cursor = db.properties.find(query).sort(
            sort_field, sort_order
        ).skip(skip).limit(limit)
        
        properties = [PropertyModel.to_dict(prop) for prop in properties_cursor]
        
        return jsonify({
            'success': True,
            'data': {
                'properties': properties,
                'pagination': {
                    'current_page': page,
                    'total_pages': total_pages,
                    'total_count': total_count,
                    'per_page': limit,
                    'has_next': page < total_pages,
                    'has_prev': page > 1
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch properties: {str(e)}'
        }), 500


# ============================================
# GET SINGLE PROPERTY
# ============================================
@properties_bp.route('/<property_id>', methods=['GET'])
def get_property(property_id):
    """Get a single property by ID"""
    try:
        db = current_app.db
        
        # Validate ObjectId
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
        
        # Increment view count
        db.properties.update_one(
            {'_id': ObjectId(property_id)},
            {'$inc': {'views': 1}}
        )
        
        property_data = PropertyModel.to_dict(property_doc)
        
        # Get agent details if exists
        if property_doc.get('agent_id'):
            agent = db.agents.find_one({'_id': ObjectId(property_doc['agent_id'])})
            if agent:
                user = db.users.find_one({'_id': ObjectId(agent['user_id'])})
                if user:
                    property_data['agent'] = {
                        'id': str(agent['_id']),
                        'name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                        'email': user.get('email'),
                        'phone': user.get('phone'),
                        'avatar': user.get('avatar'),
                        'agency': agent.get('agency')
                    }
        
        return jsonify({
            'success': True,
            'data': property_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch property: {str(e)}'
        }), 500


# ============================================
# CREATE PROPERTY
# ============================================
@properties_bp.route('', methods=['POST'])
@jwt_required()
def create_property():
    """Create a new property listing"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        # Verify user is an agent or admin
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('role') not in ['agent', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Only agents and admins can create property listings'
            }), 403
        
        # If user is an agent, get agent ID
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if agent:
                data['agent_id'] = str(agent['_id'])
        
        # Validate required fields
        required_fields = ['title', 'property_type', 'listing_type', 'price']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        # Create property
        new_property = PropertyModel.create_property(data)
        result = db.properties.insert_one(new_property)
        
        # Get created property
        property_doc = db.properties.find_one({'_id': result.inserted_id})
        property_data = PropertyModel.to_dict(property_doc)
        
        return jsonify({
            'success': True,
            'message': 'Property created successfully',
            'data': property_data
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create property: {str(e)}'
        }), 500


# ============================================
# UPDATE PROPERTY
# ============================================
@properties_bp.route('/<property_id>', methods=['PUT'])
@jwt_required()
def update_property(property_id):
    """Update an existing property"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(property_id):
            return jsonify({
                'success': False,
                'message': 'Invalid property ID'
            }), 400
        
        # Get existing property
        property_doc = db.properties.find_one({'_id': ObjectId(property_id)})
        
        if not property_doc:
            return jsonify({
                'success': False,
                'message': 'Property not found'
            }), 404
        
        # Check permission
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if not agent or str(agent['_id']) != property_doc.get('agent_id'):
                return jsonify({
                    'success': False,
                    'message': 'You can only update your own listings'
                }), 403
        elif user.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Permission denied'
            }), 403
        
        # Build update data
        update_fields = [
            'title', 'description', 'property_type', 'listing_type', 'price',
            'currency', 'address', 'features', 'amenities', 'images',
            'video_url', 'virtual_tour_url', 'status', 'featured'
        ]
        
        update_data = {k: v for k, v in data.items() if k in update_fields}
        update_data['updated_at'] = datetime.utcnow()
        
        # Update property
        db.properties.update_one(
            {'_id': ObjectId(property_id)},
            {'$set': update_data}
        )
        
        # Get updated property
        property_doc = db.properties.find_one({'_id': ObjectId(property_id)})
        property_data = PropertyModel.to_dict(property_doc)
        
        return jsonify({
            'success': True,
            'message': 'Property updated successfully',
            'data': property_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to update property: {str(e)}'
        }), 500


# ============================================
# UPLOAD PROPERTY IMAGES
# ============================================
@properties_bp.route('/<property_id>/images', methods=['POST'])
@jwt_required()
def upload_property_images(property_id):
    """Upload one or more images for a property"""
    try:
        current_user_id = get_jwt_identity()
        db = current_app.db

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

        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404

        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if not agent or str(agent['_id']) != property_doc.get('agent_id'):
                return jsonify({
                    'success': False,
                    'message': 'You can only upload images to your own listings'
                }), 403
        elif user.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Permission denied'
            }), 403

        image_files = request.files.getlist('images')
        if not image_files:
            return jsonify({
                'success': False,
                'message': 'No image files were provided'
            }), 400

        uploaded_images = []
        max_bytes_per_image = 5 * 1024 * 1024  # 5MB

        for image_file in image_files:
            if not image_file or not image_file.filename:
                continue

            mime_type = image_file.mimetype or ''
            if not mime_type.startswith('image/'):
                continue

            file_bytes = image_file.read()
            if not file_bytes or len(file_bytes) > max_bytes_per_image:
                continue

            encoded = base64.b64encode(file_bytes).decode('ascii')
            uploaded_images.append(f'data:{mime_type};base64,{encoded}')

        if not uploaded_images:
            return jsonify({
                'success': False,
                'message': 'No valid image files were uploaded. Use image files up to 5MB each.'
            }), 400

        existing_images = property_doc.get('images', [])
        merged_images = (existing_images + uploaded_images)[:12]

        db.properties.update_one(
            {'_id': ObjectId(property_id)},
            {'$set': {'images': merged_images, 'updated_at': datetime.utcnow()}}
        )

        updated_property = db.properties.find_one({'_id': ObjectId(property_id)})
        property_data = PropertyModel.to_dict(updated_property)

        return jsonify({
            'success': True,
            'message': 'Property images uploaded successfully',
            'data': {
                'property': property_data,
                'uploaded_count': len(uploaded_images)
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to upload property images: {str(e)}'
        }), 500


# ============================================
# DELETE PROPERTY
# ============================================
@properties_bp.route('/<property_id>', methods=['DELETE'])
@jwt_required()
def delete_property(property_id):
    """Delete a property listing"""
    try:
        current_user_id = get_jwt_identity()
        
        db = current_app.db
        
        # Validate ObjectId
        if not ObjectId.is_valid(property_id):
            return jsonify({
                'success': False,
                'message': 'Invalid property ID'
            }), 400
        
        # Get existing property
        property_doc = db.properties.find_one({'_id': ObjectId(property_id)})
        
        if not property_doc:
            return jsonify({
                'success': False,
                'message': 'Property not found'
            }), 404
        
        # Check permission
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        if user.get('role') == 'agent':
            agent = db.agents.find_one({'user_id': current_user_id})
            if not agent or str(agent['_id']) != property_doc.get('agent_id'):
                return jsonify({
                    'success': False,
                    'message': 'You can only delete your own listings'
                }), 403
        elif user.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Permission denied'
            }), 403
        
        # Delete property
        db.properties.delete_one({'_id': ObjectId(property_id)})
        
        return jsonify({
            'success': True,
            'message': 'Property deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete property: {str(e)}'
        }), 500


# ============================================
# GET FEATURED PROPERTIES
# ============================================
@properties_bp.route('/featured', methods=['GET'])
def get_featured_properties():
    """Get featured properties for homepage"""
    try:
        db = current_app.db
        limit = int(request.args.get('limit', 6))
        
        properties_cursor = db.properties.find({
            'featured': True,
            'status': 'available'
        }).sort('created_at', -1).limit(limit)
        
        properties = [PropertyModel.to_dict(prop) for prop in properties_cursor]
        
        return jsonify({
            'success': True,
            'data': properties
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch featured properties: {str(e)}'
        }), 500


# ============================================
# TOGGLE FAVORITE
# ============================================
@properties_bp.route('/<property_id>/favorite', methods=['POST'])
@jwt_required()
def toggle_favorite(property_id):
    """Add/remove property from favorites"""
    try:
        current_user_id = get_jwt_identity()
        
        db = current_app.db
        
        # Validate ObjectId
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
        
        # Check if already favorited
        user = db.users.find_one({'_id': ObjectId(current_user_id)})
        favorites = user.get('preferences', {}).get('favorites', [])
        
        if property_id in favorites:
            # Remove from favorites
            db.users.update_one(
                {'_id': ObjectId(current_user_id)},
                {'$pull': {'preferences.favorites': property_id}}
            )
            db.properties.update_one(
                {'_id': ObjectId(property_id)},
                {'$inc': {'favorites': -1}}
            )
            is_favorited = False
        else:
            # Add to favorites
            db.users.update_one(
                {'_id': ObjectId(current_user_id)},
                {'$addToSet': {'preferences.favorites': property_id}}
            )
            db.properties.update_one(
                {'_id': ObjectId(property_id)},
                {'$inc': {'favorites': 1}}
            )
            is_favorited = True
        
        return jsonify({
            'success': True,
            'message': 'Favorite toggled successfully',
            'data': {'is_favorited': is_favorited}
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to toggle favorite: {str(e)}'
        }), 500


# ============================================
# GET PROPERTY STATISTICS
# ============================================
@properties_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_property_stats():
    """Get property statistics for dashboard"""
    try:
        db = current_app.db
        
        # Total properties
        total_properties = db.properties.count_documents({})
        
        # Available properties
        available_properties = db.properties.count_documents({'status': 'available'})
        
        # Properties by type
        property_types = db.properties.aggregate([
            {'$group': {'_id': '$property_type', 'count': {'$sum': 1}}}
        ])
        
        # Properties by listing type
        listing_types = db.properties.aggregate([
            {'$group': {'_id': '$listing_type', 'count': {'$sum': 1}}}
        ])
        
        # Total views
        total_views_result = db.properties.aggregate([
            {'$group': {'_id': None, 'total': {'$sum': '$views'}}}
        ])
        total_views = list(total_views_result)
        total_views = total_views[0]['total'] if total_views else 0
        
        # Recent properties (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_count = db.properties.count_documents({
            'created_at': {'$gte': thirty_days_ago}
        })
        
        return jsonify({
            'success': True,
            'data': {
                'total_properties': total_properties,
                'available_properties': available_properties,
                'property_types': list(property_types),
                'listing_types': list(listing_types),
                'total_views': total_views,
                'recent_listings': recent_count
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to fetch property stats: {str(e)}'
        }), 500
