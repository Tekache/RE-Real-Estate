"""
Real Estate Management System - MongoDB Models
Database schemas and validation
"""

from datetime import datetime
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash

# ============================================
# USER MODEL
# ============================================
class UserModel:
    """User schema for authentication and authorization"""
    
    collection_name = 'users'
    
    @staticmethod
    def schema():
        return {
            'email': str,          # Required, unique
            'password': str,       # Hashed password
            'first_name': str,
            'last_name': str,
            'phone': str,
            'role': str,           # 'admin', 'agent', 'client'
            'avatar': str,         # URL to profile image
            'is_active': bool,
            'is_verified': bool,
            'created_at': datetime,
            'updated_at': datetime,
            'last_login': datetime,
            'preferences': dict    # User preferences
        }
    
    @staticmethod
    def create_user(data):
        """Create a new user document"""
        role = (data.get('role') or 'client').strip().lower()
        if role == 'user':
            role = 'client'
        if role not in ['admin', 'agent', 'client']:
            role = 'client'

        return {
            'email': data.get('email', '').lower().strip(),
            'password': generate_password_hash(data.get('password', '')),
            'first_name': data.get('first_name', ''),
            'last_name': data.get('last_name', ''),
            'phone': data.get('phone', ''),
            'role': role,
            'avatar': data.get('avatar', ''),
            'is_active': True,
            'is_verified': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'last_login': None,
            'preferences': data.get('preferences', {})
        }
    
    @staticmethod
    def verify_password(stored_password, provided_password):
        """Verify password hash"""
        return check_password_hash(stored_password, provided_password)
    
    @staticmethod
    def to_dict(user):
        """Convert user document to dictionary (exclude password)"""
        if user:
            return {
                'id': str(user.get('_id')),
                'email': user.get('email'),
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name'),
                'phone': user.get('phone'),
                'role': user.get('role'),
                'avatar': user.get('avatar'),
                'is_active': user.get('is_active'),
                'is_verified': user.get('is_verified'),
                'created_at': user.get('created_at').isoformat() if user.get('created_at') else None,
                'last_login': user.get('last_login').isoformat() if user.get('last_login') else None
            }
        return None


# ============================================
# PROPERTY MODEL
# ============================================
class PropertyModel:
    """Property listing schema"""
    
    collection_name = 'properties'
    
    @staticmethod
    def schema():
        return {
            'title': str,
            'description': str,
            'property_type': str,      # 'house', 'apartment', 'condo', 'land', 'commercial'
            'listing_type': str,       # 'sale', 'rent'
            'price': float,
            'currency': str,
            'address': {
                'street': str,
                'city': str,
                'state': str,
                'zip_code': str,
                'country': str,
                'coordinates': {
                    'lat': float,
                    'lng': float
                }
            },
            'features': {
                'bedrooms': int,
                'bathrooms': int,
                'area': float,          # Square feet/meters
                'area_unit': str,       # 'sqft', 'sqm'
                'year_built': int,
                'parking': int,
                'floors': int
            },
            'amenities': list,          # ['pool', 'gym', 'garden', etc.]
            'images': list,             # List of image URLs
            'video_url': str,
            'virtual_tour_url': str,
            'status': str,              # 'available', 'pending', 'sold', 'rented'
            'featured': bool,
            'agent_id': str,            # Reference to agent
            'owner_id': str,            # Reference to owner/client
            'views': int,
            'favorites': int,
            'created_at': datetime,
            'updated_at': datetime,
            'published_at': datetime
        }
    
    @staticmethod
    def create_property(data):
        """Create a new property document"""
        return {
            'title': data.get('title', ''),
            'description': data.get('description', ''),
            'property_type': data.get('property_type', 'house'),
            'listing_type': data.get('listing_type', 'sale'),
            'price': float(data.get('price', 0)),
            'currency': data.get('currency', 'USD'),
            'address': {
                'street': data.get('address', {}).get('street', ''),
                'city': data.get('address', {}).get('city', ''),
                'state': data.get('address', {}).get('state', ''),
                'zip_code': data.get('address', {}).get('zip_code', ''),
                'country': data.get('address', {}).get('country', 'USA'),
                'coordinates': {
                    'lat': float(data.get('address', {}).get('coordinates', {}).get('lat', 0)),
                    'lng': float(data.get('address', {}).get('coordinates', {}).get('lng', 0))
                }
            },
            'features': {
                'bedrooms': int(data.get('features', {}).get('bedrooms', 0)),
                'bathrooms': int(data.get('features', {}).get('bathrooms', 0)),
                'area': float(data.get('features', {}).get('area', 0)),
                'area_unit': data.get('features', {}).get('area_unit', 'sqft'),
                'year_built': int(data.get('features', {}).get('year_built', 0)),
                'parking': int(data.get('features', {}).get('parking', 0)),
                'floors': int(data.get('features', {}).get('floors', 1))
            },
            'amenities': data.get('amenities', []),
            'images': data.get('images', []),
            'video_url': data.get('video_url', ''),
            'virtual_tour_url': data.get('virtual_tour_url', ''),
            'status': data.get('status', 'available'),
            'featured': data.get('featured', False),
            'agent_id': data.get('agent_id', ''),
            'owner_id': data.get('owner_id', ''),
            'views': 0,
            'favorites': 0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'published_at': datetime.utcnow() if data.get('status') == 'available' else None
        }
    
    @staticmethod
    def to_dict(property_doc):
        """Convert property document to dictionary"""
        if property_doc:
            return {
                'id': str(property_doc.get('_id')),
                'title': property_doc.get('title'),
                'description': property_doc.get('description'),
                'property_type': property_doc.get('property_type'),
                'listing_type': property_doc.get('listing_type'),
                'price': property_doc.get('price'),
                'currency': property_doc.get('currency'),
                'address': property_doc.get('address'),
                'features': property_doc.get('features'),
                'amenities': property_doc.get('amenities'),
                'images': property_doc.get('images'),
                'video_url': property_doc.get('video_url'),
                'virtual_tour_url': property_doc.get('virtual_tour_url'),
                'status': property_doc.get('status'),
                'featured': property_doc.get('featured'),
                'agent_id': property_doc.get('agent_id'),
                'owner_id': property_doc.get('owner_id'),
                'views': property_doc.get('views'),
                'favorites': property_doc.get('favorites'),
                'created_at': property_doc.get('created_at').isoformat() if property_doc.get('created_at') else None,
                'updated_at': property_doc.get('updated_at').isoformat() if property_doc.get('updated_at') else None
            }
        return None


# ============================================
# AGENT MODEL
# ============================================
class AgentModel:
    """Real estate agent schema"""
    
    collection_name = 'agents'
    
    @staticmethod
    def schema():
        return {
            'user_id': str,            # Reference to user account
            'license_number': str,
            'agency': str,
            'specializations': list,    # ['residential', 'commercial', 'luxury']
            'experience_years': int,
            'bio': str,
            'languages': list,
            'certifications': list,
            'social_media': {
                'linkedin': str,
                'facebook': str,
                'twitter': str,
                'instagram': str
            },
            'stats': {
                'properties_sold': int,
                'properties_rented': int,
                'total_sales_value': float,
                'average_rating': float,
                'total_reviews': int
            },
            'availability': dict,       # Schedule/availability
            'is_verified': bool,
            'is_featured': bool,
            'created_at': datetime,
            'updated_at': datetime
        }
    
    @staticmethod
    def create_agent(data, user_id):
        """Create a new agent document"""
        return {
            'user_id': user_id,
            'license_number': data.get('license_number', ''),
            'agency': data.get('agency', ''),
            'specializations': data.get('specializations', []),
            'experience_years': int(data.get('experience_years', 0)),
            'bio': data.get('bio', ''),
            'languages': data.get('languages', ['English']),
            'certifications': data.get('certifications', []),
            'social_media': {
                'linkedin': data.get('social_media', {}).get('linkedin', ''),
                'facebook': data.get('social_media', {}).get('facebook', ''),
                'twitter': data.get('social_media', {}).get('twitter', ''),
                'instagram': data.get('social_media', {}).get('instagram', '')
            },
            'stats': {
                'properties_sold': 0,
                'properties_rented': 0,
                'total_sales_value': 0,
                'average_rating': 0,
                'total_reviews': 0
            },
            'availability': data.get('availability', {}),
            'is_verified': False,
            'is_featured': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    
    @staticmethod
    def to_dict(agent_doc, user_doc=None):
        """Convert agent document to dictionary"""
        if agent_doc:
            result = {
                'id': str(agent_doc.get('_id')),
                'user_id': agent_doc.get('user_id'),
                'license_number': agent_doc.get('license_number'),
                'agency': agent_doc.get('agency'),
                'specializations': agent_doc.get('specializations'),
                'experience_years': agent_doc.get('experience_years'),
                'bio': agent_doc.get('bio'),
                'languages': agent_doc.get('languages'),
                'certifications': agent_doc.get('certifications'),
                'social_media': agent_doc.get('social_media'),
                'stats': agent_doc.get('stats'),
                'is_verified': agent_doc.get('is_verified'),
                'is_featured': agent_doc.get('is_featured'),
                'created_at': agent_doc.get('created_at').isoformat() if agent_doc.get('created_at') else None
            }
            # Include user details if provided
            if user_doc:
                result['name'] = f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}".strip()
                result['email'] = user_doc.get('email')
                result['phone'] = user_doc.get('phone')
                result['avatar'] = user_doc.get('avatar')
            return result
        return None


# ============================================
# CLIENT MODEL
# ============================================
class ClientModel:
    """Client/Customer schema"""
    
    collection_name = 'clients'
    
    @staticmethod
    def schema():
        return {
            'user_id': str,            # Reference to user account
            'client_type': str,        # 'buyer', 'seller', 'renter', 'landlord'
            'budget_min': float,
            'budget_max': float,
            'preferred_locations': list,
            'preferred_property_types': list,
            'requirements': str,
            'assigned_agent_id': str,
            'notes': list,             # Agent notes about client
            'status': str,             # 'active', 'inactive', 'converted'
            'source': str,             # 'website', 'referral', 'advertisement'
            'created_at': datetime,
            'updated_at': datetime
        }
    
    @staticmethod
    def create_client(data, user_id):
        """Create a new client document"""
        return {
            'user_id': user_id,
            'client_type': data.get('client_type', 'buyer'),
            'budget_min': float(data.get('budget_min', 0)),
            'budget_max': float(data.get('budget_max', 0)),
            'preferred_locations': data.get('preferred_locations', []),
            'preferred_property_types': data.get('preferred_property_types', []),
            'requirements': data.get('requirements', ''),
            'assigned_agent_id': data.get('assigned_agent_id', ''),
            'notes': [],
            'status': 'active',
            'source': data.get('source', 'website'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    
    @staticmethod
    def to_dict(client_doc, user_doc=None):
        """Convert client document to dictionary"""
        if client_doc:
            result = {
                'id': str(client_doc.get('_id')),
                'user_id': client_doc.get('user_id'),
                'client_type': client_doc.get('client_type'),
                'budget_min': client_doc.get('budget_min'),
                'budget_max': client_doc.get('budget_max'),
                'preferred_locations': client_doc.get('preferred_locations'),
                'preferred_property_types': client_doc.get('preferred_property_types'),
                'requirements': client_doc.get('requirements'),
                'assigned_agent_id': client_doc.get('assigned_agent_id'),
                'status': client_doc.get('status'),
                'source': client_doc.get('source'),
                'created_at': client_doc.get('created_at').isoformat() if client_doc.get('created_at') else None
            }
            if user_doc:
                result['name'] = f"{user_doc.get('first_name', '')} {user_doc.get('last_name', '')}".strip()
                result['email'] = user_doc.get('email')
                result['phone'] = user_doc.get('phone')
            return result
        return None


# ============================================
# TRANSACTION MODEL
# ============================================
class TransactionModel:
    """Property transaction schema"""
    
    collection_name = 'transactions'
    
    @staticmethod
    def schema():
        return {
            'property_id': str,
            'client_id': str,
            'agent_id': str,
            'transaction_type': str,   # 'sale', 'rent'
            'amount': float,
            'currency': str,
            'commission': float,
            'commission_percentage': float,
            'status': str,             # 'pending', 'in_progress', 'completed', 'cancelled'
            'payment_method': str,
            'contract_date': datetime,
            'closing_date': datetime,
            'documents': list,         # List of document URLs
            'notes': str,
            'created_at': datetime,
            'updated_at': datetime
        }
    
    @staticmethod
    def create_transaction(data):
        """Create a new transaction document"""
        amount = float(data.get('amount', 0))
        commission_pct = float(data.get('commission_percentage', 3))
        
        return {
            'property_id': data.get('property_id', ''),
            'client_id': data.get('client_id', ''),
            'agent_id': data.get('agent_id', ''),
            'transaction_type': data.get('transaction_type', 'sale'),
            'amount': amount,
            'currency': data.get('currency', 'USD'),
            'commission': amount * (commission_pct / 100),
            'commission_percentage': commission_pct,
            'status': data.get('status', 'pending'),
            'payment_method': data.get('payment_method', ''),
            'contract_date': datetime.fromisoformat(data.get('contract_date')) if data.get('contract_date') else None,
            'closing_date': datetime.fromisoformat(data.get('closing_date')) if data.get('closing_date') else None,
            'documents': data.get('documents', []),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    
    @staticmethod
    def to_dict(transaction_doc, include_refs=False):
        """Convert transaction document to dictionary"""
        if transaction_doc:
            return {
                'id': str(transaction_doc.get('_id')),
                'property_id': transaction_doc.get('property_id'),
                'client_id': transaction_doc.get('client_id'),
                'agent_id': transaction_doc.get('agent_id'),
                'transaction_type': transaction_doc.get('transaction_type'),
                'amount': transaction_doc.get('amount'),
                'currency': transaction_doc.get('currency'),
                'commission': transaction_doc.get('commission'),
                'commission_percentage': transaction_doc.get('commission_percentage'),
                'status': transaction_doc.get('status'),
                'payment_method': transaction_doc.get('payment_method'),
                'contract_date': transaction_doc.get('contract_date').isoformat() if transaction_doc.get('contract_date') else None,
                'closing_date': transaction_doc.get('closing_date').isoformat() if transaction_doc.get('closing_date') else None,
                'documents': transaction_doc.get('documents'),
                'notes': transaction_doc.get('notes'),
                'created_at': transaction_doc.get('created_at').isoformat() if transaction_doc.get('created_at') else None,
                'updated_at': transaction_doc.get('updated_at').isoformat() if transaction_doc.get('updated_at') else None
            }
        return None


# ============================================
# INQUIRY MODEL
# ============================================
class InquiryModel:
    """Property inquiry/contact schema"""
    
    collection_name = 'inquiries'
    
    @staticmethod
    def create_inquiry(data):
        """Create a new inquiry document"""
        return {
            'name': data.get('name', ''),
            'email': data.get('email', ''),
            'phone': data.get('phone', ''),
            'subject': data.get('subject', ''),
            'message': data.get('message', ''),
            'property_id': data.get('property_id', ''),
            'agent_id': data.get('agent_id', ''),
            'inquiry_type': data.get('inquiry_type', 'general'),  # 'general', 'property', 'agent'
            'status': 'new',  # 'new', 'read', 'responded', 'closed'
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    
    @staticmethod
    def to_dict(inquiry_doc):
        """Convert inquiry document to dictionary"""
        if inquiry_doc:
            return {
                'id': str(inquiry_doc.get('_id')),
                'name': inquiry_doc.get('name'),
                'email': inquiry_doc.get('email'),
                'phone': inquiry_doc.get('phone'),
                'subject': inquiry_doc.get('subject'),
                'message': inquiry_doc.get('message'),
                'property_id': inquiry_doc.get('property_id'),
                'agent_id': inquiry_doc.get('agent_id'),
                'inquiry_type': inquiry_doc.get('inquiry_type'),
                'status': inquiry_doc.get('status'),
                'created_at': inquiry_doc.get('created_at').isoformat() if inquiry_doc.get('created_at') else None
            }
        return None
