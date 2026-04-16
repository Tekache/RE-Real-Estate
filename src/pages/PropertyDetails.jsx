/**
 * Property Details Page Component
 * Displays full property information with gallery and contact form
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPropertyById } from '../services/propertyService';
import { createTransaction, getTransactions } from '../services/transactionService';
import { 
  GeoAlt, 
  Heart, 
  HeartFill,
  Share,
  Rulers,
  DoorOpen,
  Water,
  Calendar,
  CarFront,
  BuildingCheck,
  Telephone,
  Envelope,
  ChevronLeft,
  Check
} from 'react-bootstrap-icons';

const PROPERTY_IMAGE_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'><rect width='100%' height='100%' fill='#e2e8f0'/><text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' fill='#64748b' font-size='26' font-family='Arial'>No property image uploaded</text></svg>"
)}`;

// Sample property data
const sampleProperty = {
  _id: '1',
  title: 'Modern Luxury Villa - Lekki',
  price: 325000000,
  listingType: 'sale',
  propertyType: 'Villa',
  address: 'Admiralty Way',
  city: 'Lagos',
  state: 'Lagos',
  zipCode: '106104',
  country: 'Nigeria',
  bedrooms: 5,
  bathrooms: 4,
  area: 4500,
  yearBuilt: 2021,
  parkingSpaces: 3,
  featured: true,
  description: `This stunning modern villa offers the epitome of luxury coastal living. Situated on a prime oceanfront lot, this architectural masterpiece features floor-to-ceiling windows that provide breathtaking views of the Atlantic Ocean.

The open-concept living space seamlessly blends indoor and outdoor living, with a gourmet kitchen featuring top-of-the-line appliances, custom cabinetry, and a spacious island. The master suite includes a private balcony, spa-like bathroom, and a walk-in closet.

Additional features include a home theater, wine cellar, smart home technology, and a resort-style pool with an infinity edge. The property also includes a private dock and direct ocean access.`,
  features: [
    'Ocean Views',
    'Private Pool',
    'Smart Home System',
    'Home Theater',
    'Wine Cellar',
    'Private Dock',
    'Gourmet Kitchen',
    'Spa Bathroom',
    'Walk-in Closets',
    'Security System',
    'Central AC',
    'High-Speed Internet'
  ],
  images: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'
  ],
  agent: {
    _id: 'a1',
    name: 'Amina Bello',
    phone: '+234 803 111 2233',
    email: 'amina@realestate.ng',
    avatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&q=80'
  }
};

const normalizeProperty = (property) => {
  const addressObj = typeof property.address === 'object' ? property.address : null;
  const featuresObj = property.features || {};

  return {
    _id: property._id || property.id,
    title: property.title,
    price: property.price,
    listingType: property.listingType || property.listing_type || 'sale',
    propertyType: property.propertyType || property.property_type || 'House',
    address: typeof property.address === 'string' ? property.address : addressObj?.street || '',
    city: property.city || addressObj?.city || 'Lagos',
    state: property.state || addressObj?.state || 'Lagos',
    zipCode: property.zipCode || addressObj?.zip_code || '',
    country: property.country || addressObj?.country || 'Nigeria',
    bedrooms: property.bedrooms ?? featuresObj.bedrooms ?? 0,
    bathrooms: property.bathrooms ?? featuresObj.bathrooms ?? 0,
    area: property.area ?? featuresObj.area ?? 0,
    yearBuilt: property.yearBuilt ?? featuresObj.year_built ?? null,
    parkingSpaces: property.parkingSpaces ?? featuresObj.parking ?? 0,
    featured: Boolean(property.featured),
    description: property.description || '',
    features: Array.isArray(property.featuresList)
      ? property.featuresList
      : Array.isArray(property.amenities)
        ? property.amenities
        : [],
    images: Array.isArray(property.images) && property.images.length > 0 ? property.images : [PROPERTY_IMAGE_PLACEHOLDER],
    agent: property.agent || sampleProperty.agent,
    coordinates: addressObj?.coordinates || null
  };
};

function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  // Fetch property details
  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const response = await getPropertyById(id);
        if (response?.success && response?.data) {
          setProperty(normalizeProperty(response.data));
        } else {
          setProperty(null);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  useEffect(() => {
    setSelectedImage(0);
  }, [property?._id]);

  useEffect(() => {
    const fetchMyTransactions = async () => {
      if (!isAuthenticated || user?.role !== 'client') {
        return;
      }
      try {
        const response = await getTransactions({ limit: 20 });
        const transactionItems = response?.data?.transactions || [];
        setTransactions(transactionItems);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      }
    };

    fetchMyTransactions();
  }, [isAuthenticated, user]);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Handle contact form submission
  const handleContactSubmit = (e) => {
    e.preventDefault();
    // In production, send to API
    console.log('Contact form submitted:', contactForm);
    alert('Message sent successfully! The agent will contact you soon.');
    setContactForm({ name: '', email: '', phone: '', message: '' });
    setShowContactForm(false);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'client') {
      setPurchaseMessage('Only client accounts can start a purchase/rental request.');
      return;
    }

    setPurchaseLoading(true);
    setPurchaseMessage('');

    try {
      const response = await createTransaction({
        property_id: property._id,
        notes: `Client request for ${property.title}`,
        payment_method: 'bank_transfer'
      });

      if (response?.success) {
        setPurchaseMessage('Request submitted successfully. You can now track it in your transactions.');
        const refreshed = await getTransactions({ limit: 20 });
        setTransactions(refreshed?.data?.transactions || []);
      } else {
        setPurchaseMessage(response?.message || 'Could not submit purchase request.');
      }
    } catch (error) {
      setPurchaseMessage(error.message || 'Could not submit purchase request.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="section text-center">
        <h2>Property Not Found</h2>
        <p>The property you are looking for does not exist.</p>
        <Link to="/properties" className="btn btn-primary-custom">
          Browse Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="property-details-page">
      {/* Page Header */}
      <section className="page-header" style={{ paddingBottom: '2rem' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <Link to="/properties" className="text-gold text-decoration-none mb-2 d-inline-block">
                <ChevronLeft /> Back to Properties
              </Link>
              <h1 className="page-header-title mb-2">{property.title}</h1>
              <div className="d-flex align-items-center gap-2 text-white-50">
                <GeoAlt />
                <span>{property.address}, {property.city}, {property.state}</span>
              </div>
            </div>
            <div className="text-end">
              <div className="h2 text-gold mb-1">
                {formatPrice(property.price)}
                {property.listingType === 'rent' && <span className="fs-6 text-white-50">/month</span>}
              </div>
              <span className={`property-badge ${property.listingType}`}>
                {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row g-4">
            {/* Main Content */}
            <div className="col-lg-8">
              {/* Image Gallery */}
              <div className="property-gallery mb-4">
                <div className="property-gallery-main">
                  <img 
                    src={property.images[selectedImage]} 
                    alt={property.title}
                  />
                </div>
                <div className="property-gallery-thumbs">
                  {property.images.slice(1, 4).map((image, index) => (
                    <div 
                      key={index}
                      className="property-gallery-thumb"
                      onClick={() => setSelectedImage(index + 1)}
                    >
                      <img src={image} alt={`${property.title} ${index + 2}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-3 mb-4">
                <button 
                  className={`btn ${isFavorite ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  {isFavorite ? <HeartFill className="me-2" /> : <Heart className="me-2" />}
                  {isFavorite ? 'Saved' : 'Save'}
                </button>
                <button className="btn btn-outline-secondary">
                  <Share className="me-2" /> Share
                </button>
                <button
                  className="btn btn-primary-custom"
                  onClick={handleBuyNow}
                  disabled={purchaseLoading}
                >
                  {purchaseLoading
                    ? 'Processing...'
                    : property.listingType === 'rent'
                      ? 'Rent This Property'
                      : 'Buy This Property'}
                </button>
              </div>

              {purchaseMessage && (
                <div className="alert alert-info mb-4">
                  {purchaseMessage}
                </div>
              )}

              {/* Property Overview */}
              <div className="dashboard-card mb-4">
                <h3 className="mb-4">Property Overview</h3>
                <div className="row g-4">
                  <div className="col-6 col-md-3">
                    <div className="text-center">
                      <DoorOpen size={32} className="text-gold mb-2" />
                      <div className="fw-bold">{property.bedrooms}</div>
                      <div className="text-muted small">Bedrooms</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-center">
                      <Water size={32} className="text-gold mb-2" />
                      <div className="fw-bold">{property.bathrooms}</div>
                      <div className="text-muted small">Bathrooms</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-center">
                      <Rulers size={32} className="text-gold mb-2" />
                      <div className="fw-bold">{property.area.toLocaleString()}</div>
                      <div className="text-muted small">Sq. Ft.</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-center">
                      <CarFront size={32} className="text-gold mb-2" />
                      <div className="fw-bold">{property.parkingSpaces}</div>
                      <div className="text-muted small">Parking</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-center">
                      <Calendar size={32} className="text-gold mb-2" />
                      <div className="fw-bold">{property.yearBuilt}</div>
                      <div className="text-muted small">Year Built</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-center">
                      <BuildingCheck size={32} className="text-gold mb-2" />
                      <div className="fw-bold">{property.propertyType}</div>
                      <div className="text-muted small">Type</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="dashboard-card mb-4">
                <h3 className="mb-3">Description</h3>
                <p style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
                  {property.description}
                </p>
              </div>

              {/* Features */}
              <div className="dashboard-card mb-4">
                <h3 className="mb-3">Features &amp; Amenities</h3>
                <div className="row g-3">
                  {property.features.map((feature, index) => (
                    <div key={index} className="col-md-4 col-6">
                      <div className="d-flex align-items-center gap-2">
                        <Check className="text-success" />
                        <span>{feature}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Map */}
              <div className="dashboard-card">
                <h3 className="mb-3">Location</h3>
                <div className="map-container">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=2.6,4.2,14.8,13.9&layer=mapnik&marker=${encodeURIComponent(
                      `${property.coordinates?.lat || 9.082},${property.coordinates?.lng || 8.6753}`
                    )}`}
                    allowFullScreen
                    loading="lazy"
                    title="Property Location"
                  ></iframe>
                </div>
                <small className="text-muted d-block mt-2">
                  Nigeria map view centered around {property.city}, {property.state}
                </small>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              {/* Agent Card */}
              <div className="dashboard-card mb-4">
                <h4 className="mb-3">Listed By</h4>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <img 
                    src={property.agent.avatar} 
                    alt={property.agent.name}
                    className="rounded-circle"
                    style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                  />
                  <div>
                    <h5 className="mb-1">{property.agent.name}</h5>
                    <p className="text-muted mb-0 small">Real Estate Agent</p>
                  </div>
                </div>
                
                <div className="d-grid gap-2">
                  <a href={`tel:${property.agent.phone}`} className="btn btn-outline-gold">
                    <Telephone className="me-2" /> Call Agent
                  </a>
                  <a href={`mailto:${property.agent.email}`} className="btn btn-outline-secondary">
                    <Envelope className="me-2" /> Email Agent
                  </a>
                  <button 
                    className="btn btn-primary-custom"
                    onClick={() => setShowContactForm((prev) => !prev)}
                  >
                    {showContactForm ? 'Hide Contact Form' : 'Send Message'}
                  </button>
                </div>
              </div>

              {/* Quick Contact Form */}
              {showContactForm && (
                <div className="dashboard-card">
                  <h4 className="mb-3">Schedule a Visit</h4>
                  <form onSubmit={handleContactSubmit}>
                    <div className="form-group">
                      <input 
                        type="text"
                        className="form-control-custom"
                        placeholder="Your Name"
                        name="name"
                        id="visitor-name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input 
                        type="email"
                        className="form-control-custom"
                        placeholder="Your Email"
                        name="email"
                        id="visitor-email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input 
                        type="tel"
                        className="form-control-custom"
                        placeholder="Your Phone"
                        name="phone"
                        id="visitor-phone"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <textarea 
                        className="form-control-custom"
                        placeholder="I am interested in this property..."
                        name="message"
                        id="visitor-message"
                        rows="4"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary-custom w-100">
                      Send Inquiry
                    </button>
                  </form>
                </div>
              )}

              {/* Transaction Tracking */}
              {isAuthenticated && user?.role === 'client' && (
                <div className="dashboard-card mt-4">
                  <h4 className="mb-3">My Property Requests</h4>
                  {transactions.length === 0 ? (
                    <p className="text-muted mb-0">No requests yet.</p>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="d-flex justify-content-between align-items-center p-2 border rounded">
                          <div>
                            <div className="fw-semibold">
                              {transaction.property?.title || 'Property Request'}
                            </div>
                            <small className="text-muted">
                              {transaction.created_at
                                ? new Date(transaction.created_at).toLocaleString()
                                : 'Recently created'}
                            </small>
                          </div>
                          <span className={`status-badge ${transaction.status}`}>
                            {transaction.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PropertyDetails;
