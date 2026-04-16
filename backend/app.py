"""
Real Estate Management System - Flask Backend
Main Application Entry Point
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import timedelta

# Load environment variables
load_dotenv()

# Import blueprints
from routes.auth import auth_bp
from routes.properties import properties_bp
from routes.agents import agents_bp
from routes.transactions import transactions_bp
from routes.clients import clients_bp
from routes.dashboard import dashboard_bp
from routes.contact import contact_bp

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    app.config['USING_MOCK_DB'] = False
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # MongoDB Configuration
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    mongo_database = os.getenv('MONGODB_DATABASE', 'real_estate_db')
    app.config['MONGO_URI'] = mongo_uri
    mongo_timeout_ms = int(os.getenv('MONGODB_TIMEOUT_MS', '5000'))
    use_mock_db_on_failure = os.getenv('USE_MOCK_DB_ON_FAILURE', 'true').lower() == 'true'

    # Initialize MongoDB
    try:
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=mongo_timeout_ms,
            connectTimeoutMS=mongo_timeout_ms,
            socketTimeoutMS=mongo_timeout_ms
        )
        app.db = client[mongo_database]
        # Test connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        app.config['USING_MOCK_DB'] = False
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")

        if use_mock_db_on_failure:
            try:
                import mongomock
                mock_client = mongomock.MongoClient()
                app.db = mock_client[mongo_database]
                app.config['USING_MOCK_DB'] = True
                print("Using in-memory mongomock database (development fallback).")
            except Exception as mock_error:
                print(f"Failed to initialize mongomock fallback: {mock_error}")
                app.db = None
                app.config['USING_MOCK_DB'] = False
        else:
            app.db = None
            app.config['USING_MOCK_DB'] = False
    
    cors_origins_value = os.getenv('CORS_ORIGINS')
    if cors_origins_value:
        # Strip trailing slashes from origins - Flask-CORS is strict about exact matches
        cors_origins = [origin.strip().rstrip('/') for origin in cors_origins_value.split(',') if origin.strip()]
    else:
        frontend_url = os.getenv('FRONTEND_URL', '').strip().rstrip('/')
        cors_origins = [frontend_url] if frontend_url else ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']

    # Initialize CORS - allow all API routes
    CORS(app,
        origins=cors_origins,
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=False,
        expose_headers=["Content-Type", "Authorization"]
    )
    
    jwt = JWTManager(app)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token has expired',
            'error': 'token_expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Invalid token',
            'error': 'invalid_token'
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Authorization token is missing',
            'error': 'authorization_required'
        }), 401

    @app.before_request
    def ensure_database_connection():
        if not request.path.startswith('/api/'):
            return None

        # Always allow CORS preflight requests
        if request.method == 'OPTIONS':
            return None

        if request.endpoint in {'health_check', 'root'}:
            return None

        if app.db is None:
            return jsonify({
                'success': False,
                'message': 'Database is unavailable. Check MongoDB connection and try again.',
                'error': 'database_unavailable'
            }), 503

        return None
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(properties_bp, url_prefix='/api/properties')
    app.register_blueprint(agents_bp, url_prefix='/api/agents')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(clients_bp, url_prefix='/api/clients')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(contact_bp, url_prefix='/api/contact')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        if app.db is None:
            db_status = 'disconnected'
        elif app.config.get('USING_MOCK_DB'):
            db_status = 'mock'
        else:
            db_status = 'connected'

        return jsonify({
            'status': 'healthy',
            'database': db_status,
            'version': '1.0.0'
        })
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Real Estate Management System API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'properties': '/api/properties',
                'agents': '/api/agents',
                'transactions': '/api/transactions',
                'clients': '/api/clients',
                'dashboard': '/api/dashboard',
                'contact': '/api/contact',
                'health': '/api/health'
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Resource not found',
            'error': 'not_found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': 'internal_error'
        }), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'message': 'Bad request',
            'error': 'bad_request'
        }), 400
    
    return app

# Create application instance
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
