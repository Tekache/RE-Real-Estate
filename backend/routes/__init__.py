"""
Routes Package
Flask blueprints for Real Estate Management System API
"""

from .auth import auth_bp
from .properties import properties_bp
from .agents import agents_bp
from .transactions import transactions_bp
from .clients import clients_bp
from .dashboard import dashboard_bp
from .contact import contact_bp

__all__ = [
    'auth_bp',
    'properties_bp',
    'agents_bp',
    'transactions_bp',
    'clients_bp',
    'dashboard_bp',
    'contact_bp'
]
