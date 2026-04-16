# Real Estate Management System - Backend

Flask-based REST API with MongoDB for the Real Estate Management System.

## Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Properties**: Full CRUD operations with filtering, search, and pagination
- **Agents**: Agent profiles with stats, reviews, and property listings
- **Clients**: Client management with notes and transaction history
- **Transactions**: Sales and rental transaction tracking
- **Dashboard**: Analytics and reporting endpoints
- **Contact**: Inquiry and contact form handling

## Tech Stack

- **Framework**: Flask 3.0
- **Database**: MongoDB (with PyMongo)
- **Authentication**: Flask-JWT-Extended
- **Security**: Werkzeug for password hashing
- **CORS**: Flask-CORS for cross-origin requests

## Quick Start

### Prerequisites

- Python 3.9+
- MongoDB (local or Atlas)
- pip or pipenv

Note:
- For local development without MongoDB installed, this backend can fallback to an in-memory mock DB using `USE_MOCK_DB_ON_FAILURE=True`.

### Installation

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Minimum required local values:
   - `SECRET_KEY`
   - `JWT_SECRET_KEY`
   - `FRONTEND_URL=http://localhost:5173`
   - `USE_MOCK_DB_ON_FAILURE=True` (if MongoDB is not installed locally)

5. **Start MongoDB** (if running locally):
   ```bash
   mongod --dbpath /path/to/your/data
   ```

6. **Seed the database** (optional, for demo data):
   ```bash
   python seed_database.py
   ```

7. **Run the development server**:
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/logout` | Logout |

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | List all properties |
| GET | `/api/properties/:id` | Get single property |
| POST | `/api/properties` | Create property (auth) |
| PUT | `/api/properties/:id` | Update property (auth) |
| DELETE | `/api/properties/:id` | Delete property (auth) |
| GET | `/api/properties/featured` | Get featured properties |
| POST | `/api/properties/:id/favorite` | Toggle favorite (auth) |
| GET | `/api/properties/stats` | Get property stats (auth) |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/:id` | Get single agent |
| POST | `/api/agents` | Create agent profile (auth) |
| PUT | `/api/agents/:id` | Update agent profile (auth) |
| DELETE | `/api/agents/:id` | Delete agent (admin) |
| GET | `/api/agents/featured` | Get featured agents |
| POST | `/api/agents/:id/review` | Add agent review (auth) |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions (auth) |
| GET | `/api/transactions/:id` | Get transaction (auth) |
| POST | `/api/transactions` | Create transaction (auth) |
| PUT | `/api/transactions/:id` | Update transaction (auth) |
| DELETE | `/api/transactions/:id` | Delete transaction (admin) |
| GET | `/api/transactions/stats` | Get transaction stats (auth) |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List clients (auth) |
| GET | `/api/clients/:id` | Get client (auth) |
| POST | `/api/clients` | Create client profile (auth) |
| PUT | `/api/clients/:id` | Update client (auth) |
| DELETE | `/api/clients/:id` | Delete client (admin) |
| POST | `/api/clients/:id/notes` | Add client note (auth) |
| GET | `/api/clients/stats` | Get client stats (auth) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Dashboard overview (auth) |
| GET | `/api/dashboard/analytics/revenue` | Revenue analytics (auth) |
| GET | `/api/dashboard/analytics/properties` | Property analytics (auth) |
| GET | `/api/dashboard/analytics/performance` | Performance metrics (auth) |
| GET | `/api/dashboard/activity` | Recent activity (auth) |

### Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact/submit` | Submit contact form |
| POST | `/api/contact/property-inquiry` | Property inquiry |
| POST | `/api/contact/agent-inquiry` | Agent inquiry |
| GET | `/api/contact/inquiries` | List inquiries (auth) |
| PUT | `/api/contact/inquiries/:id` | Update inquiry (auth) |
| DELETE | `/api/contact/inquiries/:id` | Delete inquiry (admin) |

## Query Parameters

### Properties Filtering
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `property_type` - house, apartment, condo, land, commercial
- `listing_type` - sale, rent
- `status` - available, pending, sold, rented
- `min_price` - Minimum price
- `max_price` - Maximum price
- `bedrooms` - Number of bedrooms
- `bathrooms` - Number of bathrooms
- `city` - City name
- `state` - State abbreviation
- `search` - Search in title/description
- `featured` - true/false
- `agent_id` - Filter by agent
- `sort_by` - created_at, price, price_low, price_high, views
- `sort_order` - asc, desc

## Test Accounts

After running `seed_database.py`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@realestate.com | Admin123! |
| Agent | john.smith@realestate.com | Agent123! |
| Client | robert.wilson@email.com | Client123! |

## Production Deployment

1. Set environment variables for production
   - `USE_MOCK_DB_ON_FAILURE=False`
   - `CORS_ORIGINS=https://your-frontend.vercel.app`
   - `MONGODB_URI=<your-atlas-uri>`
   - `MONGODB_DATABASE=real_estate_db`
2. Use gunicorn as the WSGI server:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```
3. Set up MongoDB Atlas for cloud database
4. Configure proper CORS origins
5. Enable HTTPS

## Security Notes

- Change all secret keys in production
- Use strong passwords
- Enable rate limiting for production
- Set up proper CORS configuration
- Use HTTPS in production
- Regularly update dependencies
