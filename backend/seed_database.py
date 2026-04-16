"""
Database Seeder
Populates the database with sample data for development/testing
"""

from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
from bson import ObjectId
import os
import random

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'real_estate_db')

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DATABASE]

# Sample data
SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
]

CITIES = [
    {"city": "Lagos", "state": "Lagos"},
    {"city": "Abuja", "state": "FCT"},
    {"city": "Port Harcourt", "state": "Rivers"},
    {"city": "Kano", "state": "Kano"},
    {"city": "Ibadan", "state": "Oyo"},
    {"city": "Enugu", "state": "Enugu"},
    {"city": "Uyo", "state": "Akwa Ibom"},
    {"city": "Owerri", "state": "Imo"},
]

AGENT_AVATARS = [
    "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&q=80",
    "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&q=80",
    "https://images.unsplash.com/photo-1595956553066-fe24a8c33395?w=400&q=80",
    "https://images.unsplash.com/photo-1627161683077-e34782c24d81?w=400&q=80",
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&q=80",
    "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&q=80",
]

PROPERTY_TITLES = [
    "Modern Luxury Villa",
    "Contemporary Family Home",
    "Elegant Penthouse Suite",
    "Charming Suburban House",
    "Waterfront Paradise",
    "Urban Loft Apartment",
    "Classic Colonial Estate",
    "Minimalist Modern Condo",
    "Spacious Ranch House",
    "Downtown High-Rise Unit",
]

AMENITIES = [
    "Swimming Pool", "Gym", "Garden", "Garage", "Security System",
    "Smart Home", "Fireplace", "Balcony", "Wine Cellar", "Home Theater",
    "Tennis Court", "Spa", "Rooftop Terrace", "Walk-in Closet", "Laundry Room"
]

def clear_database():
    """Clear all collections"""
    print("Clearing existing data...")
    db.users.delete_many({})
    db.agents.delete_many({})
    db.clients.delete_many({})
    db.properties.delete_many({})
    db.transactions.delete_many({})
    db.inquiries.delete_many({})
    db.reviews.delete_many({})
    print("Database cleared!")

def create_users():
    """Create sample users"""
    print("Creating users...")
    
    users = []
    
    # Admin user
    admin = {
        '_id': ObjectId(),
        'email': 'admin@realestate.com',
        'password': generate_password_hash('Admin123!'),
        'first_name': 'System',
        'last_name': 'Admin',
        'phone': '+1 (555) 000-0001',
        'role': 'admin',
        'avatar': 'https://randomuser.me/api/portraits/men/1.jpg',
        'is_active': True,
        'is_verified': True,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'last_login': datetime.utcnow(),
        'preferences': {}
    }
    users.append(admin)
    
    # Agent users
    agent_names = [
        ('John', 'Smith', 'men', 10),
        ('Sarah', 'Johnson', 'women', 20),
        ('Michael', 'Williams', 'men', 30),
        ('Emily', 'Brown', 'women', 40),
        ('David', 'Davis', 'men', 50),
        ('Jessica', 'Miller', 'women', 60),
    ]
    
    for idx, (first, last, gender, num) in enumerate(agent_names):
        user = {
            '_id': ObjectId(),
            'email': f'{first.lower()}.{last.lower()}@realestate.com',
            'password': generate_password_hash('Agent123!'),
            'first_name': first,
            'last_name': last,
            'phone': f'+1 (555) {random.randint(100, 999)}-{random.randint(1000, 9999)}',
            'role': 'agent',
            'avatar': AGENT_AVATARS[idx % len(AGENT_AVATARS)],
            'is_active': True,
            'is_verified': True,
            'created_at': datetime.utcnow() - timedelta(days=random.randint(30, 365)),
            'updated_at': datetime.utcnow(),
            'last_login': datetime.utcnow() - timedelta(days=random.randint(0, 7)),
            'preferences': {}
        }
        users.append(user)
    
    # Client users
    client_names = [
        ('Robert', 'Wilson', 'men', 15),
        ('Jennifer', 'Taylor', 'women', 25),
        ('James', 'Anderson', 'men', 35),
        ('Lisa', 'Thomas', 'women', 45),
        ('William', 'Jackson', 'men', 55),
        ('Amanda', 'White', 'women', 65),
        ('Christopher', 'Harris', 'men', 75),
        ('Michelle', 'Martin', 'women', 85),
    ]
    
    for first, last, gender, num in client_names:
        user = {
            '_id': ObjectId(),
            'email': f'{first.lower()}.{last.lower()}@email.com',
            'password': generate_password_hash('Client123!'),
            'first_name': first,
            'last_name': last,
            'phone': f'+1 (555) {random.randint(100, 999)}-{random.randint(1000, 9999)}',
            'role': 'client',
            'avatar': f'https://randomuser.me/api/portraits/{gender}/{num}.jpg',
            'is_active': True,
            'is_verified': True,
            'created_at': datetime.utcnow() - timedelta(days=random.randint(10, 180)),
            'updated_at': datetime.utcnow(),
            'last_login': datetime.utcnow() - timedelta(days=random.randint(0, 14)),
            'preferences': {'favorites': []}
        }
        users.append(user)
    
    db.users.insert_many(users)
    print(f"Created {len(users)} users")
    return users

def create_agents(users):
    """Create agent profiles"""
    print("Creating agent profiles...")
    
    agent_users = [u for u in users if u['role'] == 'agent']
    agents = []
    
    specializations = ['Residential', 'Commercial', 'Luxury', 'Investment', 'Rental']
    agencies = ['Premier Real Estate', 'Elite Properties', 'Urban Realty', 'Coastal Homes', 'City Living']
    
    for user in agent_users:
        agent = {
            '_id': ObjectId(),
            'user_id': str(user['_id']),
            'license_number': f'RE{random.randint(100000, 999999)}',
            'agency': random.choice(agencies),
            'specializations': random.sample(specializations, random.randint(2, 4)),
            'experience_years': random.randint(3, 20),
            'bio': f"Experienced real estate professional with a passion for helping clients find their perfect property. Specializing in {random.choice(['residential', 'commercial', 'luxury'])} properties with a track record of successful transactions.",
            'languages': ['English'] + random.sample(['Spanish', 'French', 'Mandarin', 'German'], random.randint(0, 2)),
            'certifications': random.sample(['Certified Residential Specialist', 'Accredited Buyer Representative', 'Seniors Real Estate Specialist'], random.randint(1, 3)),
            'social_media': {
                'linkedin': f'https://linkedin.com/in/{user["first_name"].lower()}{user["last_name"].lower()}',
                'facebook': '',
                'twitter': '',
                'instagram': ''
            },
            'stats': {
                'properties_sold': random.randint(20, 150),
                'properties_rented': random.randint(10, 80),
                'total_sales_value': random.randint(5000000, 50000000),
                'average_rating': round(random.uniform(4.2, 5.0), 1),
                'total_reviews': random.randint(15, 100)
            },
            'availability': {},
            'is_verified': True,
            'is_featured': random.choice([True, False]),
            'created_at': user['created_at'],
            'updated_at': datetime.utcnow()
        }
        agents.append(agent)
    
    db.agents.insert_many(agents)
    print(f"Created {len(agents)} agent profiles")
    return agents

def create_clients(users, agents):
    """Create client profiles"""
    print("Creating client profiles...")
    
    client_users = [u for u in users if u['role'] == 'client']
    clients = []
    
    property_types = ['house', 'apartment', 'condo', 'land', 'commercial']
    
    for user in client_users:
        budget_min = random.choice([100000, 200000, 300000, 500000, 750000, 1000000])
        client = {
            '_id': ObjectId(),
            'user_id': str(user['_id']),
            'client_type': random.choice(['buyer', 'seller', 'renter', 'landlord']),
            'budget_min': budget_min,
            'budget_max': budget_min * random.uniform(1.5, 3),
            'preferred_locations': random.sample([c['city'] for c in CITIES], random.randint(1, 3)),
            'preferred_property_types': random.sample(property_types, random.randint(1, 3)),
            'requirements': 'Looking for a property with good neighborhood and modern amenities.',
            'assigned_agent_id': str(random.choice(agents)['_id']),
            'notes': [],
            'status': random.choice(['active', 'active', 'active', 'inactive', 'converted']),
            'source': random.choice(['website', 'referral', 'advertisement', 'social_media']),
            'created_at': user['created_at'],
            'updated_at': datetime.utcnow()
        }
        clients.append(client)
    
    db.clients.insert_many(clients)
    print(f"Created {len(clients)} client profiles")
    return clients

def create_properties(agents):
    """Create sample properties"""
    print("Creating properties...")
    
    properties = []
    property_types = ['house', 'apartment', 'condo', 'land', 'commercial']
    statuses = ['available', 'available', 'available', 'pending', 'sold', 'rented']
    
    for i in range(24):
        city_data = random.choice(CITIES)
        property_type = random.choice(property_types)
        listing_type = random.choice(['sale', 'rent'])
        
        if listing_type == 'rent':
            price = random.randint(1500, 15000)
        else:
            price = random.randint(250000, 5000000)
        
        prop = {
            '_id': ObjectId(),
            'title': f"{random.choice(PROPERTY_TITLES)} in {city_data['city']}",
            'description': f"Beautiful {property_type} located in the heart of {city_data['city']}. This stunning property features modern design, premium finishes, and exceptional amenities. Perfect for families or professionals seeking luxury living in a prime location.",
            'property_type': property_type,
            'listing_type': listing_type,
            'price': price,
            'currency': 'USD',
            'address': {
                'street': f'{random.randint(100, 9999)} {random.choice(["Oak", "Maple", "Pine", "Cedar", "Elm"])} {random.choice(["Street", "Avenue", "Boulevard", "Drive"])}',
                'city': city_data['city'],
                'state': city_data['state'],
                'zip_code': str(random.randint(10000, 99999)),
                'country': 'USA',
                'coordinates': {
                    'lat': random.uniform(4.0, 13.8),
                    'lng': random.uniform(2.7, 14.9)
                }
            },
            'features': {
                'bedrooms': random.randint(1, 6),
                'bathrooms': random.randint(1, 5),
                'area': random.randint(800, 6000),
                'area_unit': 'sqft',
                'year_built': random.randint(1990, 2024),
                'parking': random.randint(0, 4),
                'floors': random.randint(1, 3)
            },
            'amenities': random.sample(AMENITIES, random.randint(4, 10)),
            'images': random.sample(SAMPLE_IMAGES, random.randint(3, 6)),
            'video_url': '',
            'virtual_tour_url': '',
            'status': random.choice(statuses),
            'featured': random.choice([True, False, False]),
            'agent_id': str(random.choice(agents)['_id']),
            'owner_id': '',
            'views': random.randint(50, 2000),
            'favorites': random.randint(5, 100),
            'created_at': datetime.utcnow() - timedelta(days=random.randint(1, 180)),
            'updated_at': datetime.utcnow(),
            'published_at': datetime.utcnow() - timedelta(days=random.randint(1, 30))
        }
        properties.append(prop)
    
    db.properties.insert_many(properties)
    print(f"Created {len(properties)} properties")
    return properties

def create_transactions(properties, agents, clients):
    """Create sample transactions"""
    print("Creating transactions...")
    
    transactions = []
    sold_properties = [p for p in properties if p['status'] in ['sold', 'rented', 'pending']]
    
    for prop in sold_properties:
        transaction = {
            '_id': ObjectId(),
            'property_id': str(prop['_id']),
            'client_id': str(random.choice(clients)['_id']),
            'agent_id': prop['agent_id'],
            'transaction_type': 'rent' if prop['status'] == 'rented' else 'sale',
            'amount': prop['price'],
            'currency': 'USD',
            'commission': prop['price'] * 0.03,
            'commission_percentage': 3.0,
            'status': 'completed' if prop['status'] in ['sold', 'rented'] else 'pending',
            'payment_method': random.choice(['wire_transfer', 'check', 'mortgage', 'cash']),
            'contract_date': datetime.utcnow() - timedelta(days=random.randint(30, 90)),
            'closing_date': datetime.utcnow() - timedelta(days=random.randint(1, 29)) if prop['status'] in ['sold', 'rented'] else None,
            'documents': [],
            'notes': 'Transaction processed successfully.',
            'created_at': datetime.utcnow() - timedelta(days=random.randint(30, 90)),
            'updated_at': datetime.utcnow()
        }
        transactions.append(transaction)
    
    db.transactions.insert_many(transactions)
    print(f"Created {len(transactions)} transactions")
    return transactions

def create_inquiries():
    """Create sample inquiries"""
    print("Creating inquiries...")
    
    inquiries = []
    names = [
        ('Alex', 'Turner'), ('Rachel', 'Green'), ('Mark', 'Spencer'),
        ('Diana', 'Ross'), ('Peter', 'Parker'), ('Mary', 'Jane')
    ]
    
    for first, last in names:
        inquiry = {
            '_id': ObjectId(),
            'name': f'{first} {last}',
            'email': f'{first.lower()}.{last.lower()}@example.com',
            'phone': f'+1 (555) {random.randint(100, 999)}-{random.randint(1000, 9999)}',
            'subject': random.choice(['Property Inquiry', 'Schedule Viewing', 'Price Negotiation', 'General Question']),
            'message': 'I am interested in learning more about your properties. Please contact me at your earliest convenience.',
            'property_id': '',
            'agent_id': '',
            'inquiry_type': 'general',
            'status': random.choice(['new', 'read', 'responded']),
            'created_at': datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            'updated_at': datetime.utcnow()
        }
        inquiries.append(inquiry)
    
    db.inquiries.insert_many(inquiries)
    print(f"Created {len(inquiries)} inquiries")
    return inquiries

def seed_database():
    """Main seeding function"""
    print("\n" + "="*50)
    print("REAL ESTATE MANAGEMENT SYSTEM - DATABASE SEEDER")
    print("="*50 + "\n")
    
    try:
        # Clear existing data
        clear_database()
        
        # Create sample data
        users = create_users()
        agents = create_agents(users)
        clients = create_clients(users, agents)
        properties = create_properties(agents)
        transactions = create_transactions(properties, agents, clients)
        inquiries = create_inquiries()
        
        print("\n" + "="*50)
        print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("="*50)
        print("\nTest Accounts:")
        print("-" * 40)
        print("Admin:  admin@realestate.com / Admin123!")
        print("Agent:  john.smith@realestate.com / Agent123!")
        print("Client: robert.wilson@email.com / Client123!")
        print("-" * 40 + "\n")
        
    except Exception as e:
        print(f"\nError seeding database: {e}")
        raise

if __name__ == '__main__':
    seed_database()
