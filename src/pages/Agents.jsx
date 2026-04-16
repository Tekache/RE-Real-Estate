/**
 * Agents Page Component
 * Displays all real estate agents with search functionality
 */

import React, { useState, useEffect, useMemo } from 'react';
import AgentCard from '../components/AgentCard';
import { Search, SortDown, People } from 'react-bootstrap-icons';
import { getAgents } from '../services/agentService';

// Sample agents data
const sampleAgents = [
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
    avatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&q=80',
    linkedin: 'https://linkedin.com'
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
    avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&q=80',
    linkedin: 'https://linkedin.com'
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
    avatar: 'https://images.unsplash.com/photo-1595956553066-fe24a8c33395?w=400&q=80',
    linkedin: 'https://linkedin.com'
  },
  {
    _id: '4',
    name: 'Femi Akinola',
    specialization: 'Investment Properties',
    phone: '+234 813 999 4455',
    email: 'femi@realestate.ng',
    propertiesCount: 33,
    salesCount: 78,
    rating: 4.7,
    reviewCount: 45,
    avatar: 'https://images.unsplash.com/photo-1627161683077-e34782c24d81?w=400&q=80',
    linkedin: 'https://linkedin.com'
  },
  {
    _id: '5',
    name: 'Zainab Musa',
    specialization: 'Vacation Homes',
    phone: '+234 802 555 0099',
    email: 'zainab@realestate.ng',
    propertiesCount: 41,
    salesCount: 112,
    rating: 4.8,
    reviewCount: 76,
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&q=80',
    linkedin: 'https://linkedin.com'
  },
  {
    _id: '6',
    name: 'Ibrahim Sule',
    specialization: 'New Developments',
    phone: '+234 814 111 6700',
    email: 'ibrahim@realestate.ng',
    propertiesCount: 29,
    salesCount: 67,
    rating: 4.6,
    reviewCount: 38,
    avatar: 'https://images.unsplash.com/photo-1549068106-b024baf5062d?w=400&q=80',
    linkedin: 'https://linkedin.com'
  },
  {
    _id: '7',
    name: 'Adaobi Eze',
    specialization: 'First-Time Buyers',
    phone: '+234 810 225 9001',
    email: 'adaobi@realestate.ng',
    propertiesCount: 47,
    salesCount: 135,
    rating: 4.9,
    reviewCount: 92,
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
    linkedin: 'https://linkedin.com'
  },
  {
    _id: '8',
    name: 'Tunde Balogun',
    specialization: 'Rental Properties',
    phone: '+234 816 730 8844',
    email: 'tunde@realestate.ng',
    propertiesCount: 56,
    salesCount: 89,
    rating: 4.7,
    reviewCount: 54,
    avatar: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&q=80',
    linkedin: 'https://linkedin.com'
  }
];

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
  avatar: agent.avatar,
  linkedin: agent.linkedin || agent.social_media?.linkedin || 'https://linkedin.com'
});

function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterSpecialization, setFilterSpecialization] = useState('');

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const response = await getAgents({ limit: 100 });
        const apiAgents = response?.data?.agents || [];
        if (response?.success && apiAgents.length > 0) {
          setAgents(apiAgents.map(normalizeAgent));
        } else {
          setAgents(sampleAgents);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
        setAgents(sampleAgents);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Get unique specializations for filter
  const specializations = useMemo(() => {
    const specs = [...new Set(agents.map(agent => agent.specialization))];
    return specs.sort();
  }, [agents]);

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let result = [...agents];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(agent => 
        agent.name.toLowerCase().includes(term) ||
        agent.specialization.toLowerCase().includes(term)
      );
    }

    // Specialization filter
    if (filterSpecialization) {
      result = result.filter(agent => agent.specialization === filterSpecialization);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'sales':
        result.sort((a, b) => b.salesCount - a.salesCount);
        break;
      case 'properties':
        result.sort((a, b) => b.propertiesCount - a.propertiesCount);
        break;
      default:
        break;
    }

    return result;
  }, [agents, searchTerm, sortBy, filterSpecialization]);

  return (
    <div className="agents-page">
      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <div className="page-header-content">
            <h1 className="page-header-title">Our Agents</h1>
            <div className="page-header-breadcrumb">
              <a href="/">Home</a>
              <span>/</span>
              <span>Agents</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container">
          {/* Search and Filter Bar */}
          <div className="dashboard-card mb-4">
            <div className="row g-3 align-items-end">
              {/* Search */}
              <div className="col-md-4">
                <label className="form-label small text-muted">Search Agents</label>
                <div className="position-relative">
                  <input 
                    type="text"
                    className="form-control-custom"
                    placeholder="Search by name or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search 
                    className="position-absolute text-muted" 
                    style={{ right: '15px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              {/* Specialization Filter */}
              <div className="col-md-4">
                <label className="form-label small text-muted">Specialization</label>
                <select 
                  className="form-control-custom"
                  value={filterSpecialization}
                  onChange={(e) => setFilterSpecialization(e.target.value)}
                >
                  <option value="">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="col-md-4">
                <label className="form-label small text-muted">Sort By</label>
                <div className="d-flex align-items-center gap-2">
                  <SortDown className="text-muted" />
                  <select 
                    className="form-control-custom"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="rating">Highest Rating</option>
                    <option value="sales">Most Sales</option>
                    <option value="properties">Most Properties</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <p className="mb-4 text-muted">
            Showing <strong>{filteredAgents.length}</strong> agents
          </p>

          {/* Agents Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner"></div>
              <p className="mt-3 text-muted">Loading agents...</p>
            </div>
          ) : filteredAgents.length > 0 ? (
            <div className="row g-4">
              {filteredAgents.map((agent, index) => (
                <div 
                  key={agent._id} 
                  className="col-lg-3 col-md-4 col-sm-6 fade-in visible"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <AgentCard agent={agent} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="mb-4">
                <People size={64} className="text-muted" />
              </div>
              <h3>No Agents Found</h3>
              <p className="text-muted">
                Try adjusting your search criteria.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterSpecialization('');
                }} 
                className="btn btn-primary-custom"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Join Our Team CTA */}
      <section className="cta-section">
        <div className="cta-background">
          <img 
            src="https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=1920&q=80" 
            alt="Join Our Team"
          />
        </div>
        <div className="cta-overlay"></div>
        
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Become a Real Estate Agent</h2>
            <p className="cta-description">
              Join our team of professional agents and take your career to the next level. 
              We provide the tools, training, and support you need to succeed.
            </p>
            <a href="/contact" className="btn btn-primary-custom">
              Apply Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Agents;
