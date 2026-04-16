/**
 * Home Page Component
 * Landing page with hero, featured properties, stats, and testimonials
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import AgentCard from '../components/AgentCard';
import SearchBar from '../components/SearchBar';
import { getFeaturedProperties } from '../services/propertyService';
import { getFeaturedAgents } from '../services/agentService';
import { 
  Building, 
  People, 
  Award, 
  GeoAlt,
  ShieldCheck,
  Headset,
  GraphUp,
  HouseDoor,
  StarFill,
  ChevronRight,
  ArrowRight
} from 'react-bootstrap-icons';

// Sample data for demonstration
const fallbackProperties = [
  {
    _id: '1',
    title: 'Modern Luxury Villa',
    price: 1250000,
    listingType: 'sale',
    address: 'Victoria Island',
    city: 'Lagos',
    bedrooms: 5,
    bathrooms: 4,
    area: 4500,
    featured: true,
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80']
  },
  {
    _id: '2',
    title: 'Downtown Penthouse',
    price: 8500,
    listingType: 'rent',
    address: 'Wuse Zone 4',
    city: 'Abuja',
    bedrooms: 3,
    bathrooms: 2,
    area: 2200,
    featured: true,
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80']
  },
  {
    _id: '3',
    title: 'Beachfront Estate',
    price: 2800000,
    listingType: 'sale',
    address: 'GRA Phase 2',
    city: 'Port Harcourt',
    bedrooms: 6,
    bathrooms: 5,
    area: 6200,
    featured: true,
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80']
  }
];

const fallbackAgents = [
  {
    _id: '1',
    name: 'Amina Bello',
    specialization: 'Luxury Properties',
    phone: '+234 803 111 2233',
    email: 'amina@realestate.ng',
    propertiesCount: 45,
    salesCount: 128,
    rating: 4.9,
    reviewCount: 87,
    avatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&q=80'
  },
  {
    _id: '2',
    name: 'Chinedu Okafor',
    specialization: 'Commercial Real Estate',
    phone: '+234 806 444 8899',
    email: 'chinedu@realestate.ng',
    propertiesCount: 38,
    salesCount: 95,
    rating: 4.8,
    reviewCount: 62,
    avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&q=80'
  },
  {
    _id: '3',
    name: 'Nneka Adeyemi',
    specialization: 'Residential Homes',
    phone: '+234 809 777 2211',
    email: 'nneka@realestate.ng',
    propertiesCount: 52,
    salesCount: 142,
    rating: 4.9,
    reviewCount: 104,
    avatar: 'https://images.unsplash.com/photo-1595956553066-fe24a8c33395?w=400&q=80'
  }
];

const normalizeProperty = (property) => ({
  _id: property._id || property.id,
  title: property.title,
  price: property.price,
  listingType: property.listingType || property.listing_type,
  address: typeof property.address === 'string' ? property.address : property.address?.street,
  city: property.city || property.address?.city || 'Lagos',
  bedrooms: property.bedrooms ?? property.features?.bedrooms ?? 0,
  bathrooms: property.bathrooms ?? property.features?.bathrooms ?? 0,
  area: property.area ?? property.features?.area ?? 0,
  featured: Boolean(property.featured),
  images: property.images || []
});

const normalizeAgent = (agent) => ({
  _id: agent._id || agent.id,
  name: agent.name,
  specialization: agent.specialization || (agent.specializations || []).join(', ') || 'Real Estate Agent',
  phone: agent.phone,
  email: agent.email,
  propertiesCount: agent.propertiesCount ?? agent.active_listings ?? 0,
  salesCount: agent.salesCount ?? ((agent.stats?.properties_sold || 0) + (agent.stats?.properties_rented || 0)),
  rating: agent.rating ?? agent.stats?.average_rating ?? 0,
  reviewCount: agent.reviewCount ?? agent.stats?.total_reviews ?? 0,
  avatar: agent.avatar
});

const testimonials = [
  {
    id: 1,
    content: 'The Real Estate Management System made finding our dream home so easy. The search filters were incredibly helpful, and our agent was fantastic throughout the entire process.',
    author: 'Jennifer & Mark Thompson',
    role: 'Homeowners',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&q=80',
    rating: 5
  },
  {
    id: 2,
    content: 'As a property investor, I have used many platforms, but this one stands out. The dashboard provides excellent insights, and the transaction tracking is seamless.',
    author: 'Robert Williams',
    role: 'Property Investor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    rating: 5
  },
  {
    id: 3,
    content: 'Managing my rental properties has never been easier. The system helps me track everything from client interactions to rent payments. Highly recommended!',
    author: 'Amanda Foster',
    role: 'Landlord',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    rating: 5
  }
];

function Home() {
  const [isVisible, setIsVisible] = useState({});
  const [featuredProperties, setFeaturedProperties] = useState(fallbackProperties);
  const [topAgents, setTopAgents] = useState(fallbackAgents);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.animate-section');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [propertiesResponse, agentsResponse] = await Promise.all([
          getFeaturedProperties(),
          getFeaturedAgents(6)
        ]);

        if (propertiesResponse?.success && Array.isArray(propertiesResponse.data) && propertiesResponse.data.length > 0) {
          setFeaturedProperties(propertiesResponse.data.map(normalizeProperty));
        }

        if (agentsResponse?.success && Array.isArray(agentsResponse.data) && agentsResponse.data.length > 0) {
          setTopAgents(agentsResponse.data.map(normalizeAgent));
        }
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80" 
            alt="Luxury Property"
          />
        </div>
        <div className="hero-overlay"></div>
        
        <div className="hero-content">
          <p className="hero-subtitle">Welcome to RealEstate Management</p>
          <h1 className="hero-title">
            Find Your Perfect <span>Property</span>
          </h1>
          <p className="hero-description">
            Discover exceptional properties, connect with expert agents, and experience 
            seamless property management with our comprehensive real estate platform.
          </p>
          <div className="hero-buttons">
            <Link to="/properties" className="btn btn-primary-custom">
              Browse Properties <ChevronRight />
            </Link>
            <Link to="/contact" className="btn btn-secondary-custom">
              Contact Us
            </Link>
          </div>

          {/* Hero Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-number">2,500+</div>
              <div className="hero-stat-label">Properties Listed</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">1,800+</div>
              <div className="hero-stat-label">Happy Clients</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">150+</div>
              <div className="hero-stat-label">Expert Agents</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <span></span>
        </div>
      </section>

      {/* Search Bar Section */}
      <section className="container">
        <SearchBar />
      </section>

      {/* Featured Properties Section */}
      <section id="featured-properties" className="section animate-section">
        <div className="container">
          <div className="section-header">
            <p className="section-subtitle">Featured Listings</p>
            <h2 className="section-title">Discover Our Best Properties</h2>
            <p className="section-description">
              Handpicked premium properties that offer exceptional value and lifestyle.
            </p>
          </div>

          <div className={`row g-4 ${isVisible['featured-properties'] ? 'fade-in visible' : 'fade-in'}`}>
            {featuredProperties.map((property, index) => (
              <div key={property._id} className={`col-lg-4 col-md-6 stagger-${index + 1}`}>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <Link to="/properties" className="btn btn-outline-gold">
              View All Properties <ArrowRight className="ms-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-3 col-sm-6">
              <div className="stat-card glass-card">
                <div className="stat-icon">
                  <Building />
                </div>
                <div className="stat-number">2,500+</div>
                <div className="stat-label">Properties</div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6">
              <div className="stat-card glass-card">
                <div className="stat-icon">
                  <People />
                </div>
                <div className="stat-number">150+</div>
                <div className="stat-label">Expert Agents</div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6">
              <div className="stat-card glass-card">
                <div className="stat-icon">
                  <Award />
                </div>
                <div className="stat-number">98%</div>
                <div className="stat-label">Client Satisfaction</div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6">
              <div className="stat-card glass-card">
                <div className="stat-icon">
                  <GeoAlt />
                </div>
                <div className="stat-number">50+</div>
                <div className="stat-label">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Features Section */}
      <section id="features" className="section section-gray animate-section">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className={`${isVisible['features'] ? 'slide-in-left visible' : 'slide-in-left'}`}>
                <p className="section-subtitle">Why Choose Us</p>
                <h2 className="section-title">Streamline Your Real Estate Journey</h2>
                <p className="section-description text-start mb-4">
                  Our Real Estate Management System is designed to simplify every aspect 
                  of property management, from listing to closing deals.
                </p>
                
                <div className="row g-4">
                  <div className="col-sm-6">
                    <div className="feature-card">
                      <div className="feature-icon">
                        <HouseDoor />
                      </div>
                      <h4 className="feature-title">Property Listings</h4>
                      <p className="feature-description">
                        Easily manage and showcase your properties with detailed listings.
                      </p>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="feature-card">
                      <div className="feature-icon">
                        <People />
                      </div>
                      <h4 className="feature-title">Agent Management</h4>
                      <p className="feature-description">
                        Assign properties to agents and track their performance.
                      </p>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="feature-card">
                      <div className="feature-icon">
                        <GraphUp />
                      </div>
                      <h4 className="feature-title">Transaction Tracking</h4>
                      <p className="feature-description">
                        Monitor sales and rentals with comprehensive transaction history.
                      </p>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="feature-card">
                      <div className="feature-icon">
                        <ShieldCheck />
                      </div>
                      <h4 className="feature-title">Secure Platform</h4>
                      <p className="feature-description">
                        Your data is protected with enterprise-grade security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className={`${isVisible['features'] ? 'slide-in-right visible' : 'slide-in-right'}`}>
                <img 
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
                  alt="Real Estate Management"
                  className="img-fluid rounded-xl shadow-lg"
                  style={{ borderRadius: '1rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Agents Section */}
      <section id="agents" className="section animate-section">
        <div className="container">
          <div className="section-header">
            <p className="section-subtitle">Our Team</p>
            <h2 className="section-title">Meet Our Top Agents</h2>
            <p className="section-description">
              Connect with experienced professionals who are dedicated to helping you 
              find your perfect property.
            </p>
          </div>

          <div className={`row g-4 ${isVisible['agents'] ? 'fade-in visible' : 'fade-in'}`}>
            {topAgents.map((agent, index) => (
              <div key={agent._id} className={`col-lg-4 col-md-6 stagger-${index + 1}`}>
                <AgentCard agent={agent} />
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <Link to="/agents" className="btn btn-outline-gold">
              View All Agents <ArrowRight className="ms-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="section section-dark animate-section">
        <div className="container">
          <div className="section-header">
            <p className="section-subtitle">Testimonials</p>
            <h2 className="section-title">What Our Clients Say</h2>
            <p className="section-description">
              Real stories from satisfied clients who found their perfect properties through us.
            </p>
          </div>

          <div className={`row g-4 ${isVisible['testimonials'] ? 'fade-in visible' : 'fade-in'}`}>
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.id} className={`col-lg-4 col-md-6 stagger-${index + 1}`}>
                <div className="testimonial-card">
                  <p className="testimonial-content">{testimonial.content}</p>
                  <div className="testimonial-author">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.author}
                      className="testimonial-avatar"
                    />
                    <div>
                      <h5 className="testimonial-name">{testimonial.author}</h5>
                      <p className="testimonial-role">{testimonial.role}</p>
                      <div className="testimonial-rating">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <StarFill key={i} size={14} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-background">
          <img 
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80" 
            alt="Luxury Home"
          />
        </div>
        <div className="cta-overlay"></div>
        
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Find Your Dream Property?</h2>
            <p className="cta-description">
              Join thousands of satisfied clients who have found their perfect homes 
              through our platform. Start your journey today.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Link to="/signup" className="btn btn-primary-custom">
                Get Started Free
              </Link>
              <Link to="/properties" className="btn btn-secondary-custom">
                Browse Properties
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <p className="section-subtitle">Our Services</p>
            <h2 className="section-title">Comprehensive Real Estate Solutions</h2>
          </div>

          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className="feature-card text-center">
                <div className="feature-icon mx-auto">
                  <HouseDoor />
                </div>
                <h4 className="feature-title">Property Sales</h4>
                <p className="feature-description">
                  Buy or sell properties with expert guidance and market insights.
                </p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="feature-card text-center">
                <div className="feature-icon mx-auto">
                  <Building />
                </div>
                <h4 className="feature-title">Rental Management</h4>
                <p className="feature-description">
                  Streamlined rental services for landlords and tenants.
                </p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="feature-card text-center">
                <div className="feature-icon mx-auto">
                  <Headset />
                </div>
                <h4 className="feature-title">24/7 Support</h4>
                <p className="feature-description">
                  Round-the-clock assistance for all your real estate needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
