/**
 * Properties Page Component
 * Displays property listings with search and filter functionality
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import { getProperties as getPropertiesFromApi } from '../services/propertyService';
import { 
  Grid3x3Gap, 
  ListUl, 
  Building,
  SortDown,
  Funnel,
  X
} from 'react-bootstrap-icons';

const normalizeProperty = (property) => ({
  _id: property._id || property.id,
  title: property.title,
  price: property.price,
  listingType: property.listingType || property.listing_type,
  propertyType: property.propertyType || property.property_type,
  address: typeof property.address === 'string' ? property.address : property.address?.street,
  city: property.city || property.address?.city || 'Lagos',
  bedrooms: property.bedrooms ?? property.features?.bedrooms ?? 0,
  bathrooms: property.bathrooms ?? property.features?.bathrooms ?? 0,
  area: property.area ?? property.features?.area ?? 0,
  featured: Boolean(property.featured),
  images: property.images || []
});

function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  // Get initial filters from URL
  const initialFilters = {
    location: searchParams.get('location') || '',
    propertyType: searchParams.get('propertyType') || '',
    listingType: searchParams.get('listingType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || ''
  };

  const [filters, setFilters] = useState(initialFilters);

  // Fetch properties from API based on active filters/sort
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError('');
      try {
        const sortMap = {
          newest: 'created_at',
          'price-low': 'price_low',
          'price-high': 'price_high',
          area: 'created_at'
        };

        const response = await getPropertiesFromApi({
          ...filters,
          sort_by: sortMap[sortBy] || 'created_at',
          sort_order: sortBy === 'price-low' ? 'asc' : 'desc',
          limit: 100
        });

        const apiProperties = response?.data?.properties || [];
        if (response?.success) setProperties(apiProperties.map(normalizeProperty));
        else setProperties([]);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError(error.message || 'Failed to load properties.');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters, sortBy]);

  const displayedProperties = useMemo(() => properties, [properties]);

  // Handle search
  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    setSearchParams(params);
  };

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters = {
      location: '',
      propertyType: '',
      listingType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: ''
    };
    setFilters(emptyFilters);
    setSearchParams({});
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="properties-page">
      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <div className="page-header-content">
            <h1 className="page-header-title">Properties</h1>
            <div className="page-header-breadcrumb">
              <a href="/">Home</a>
              <span>/</span>
              <span>Properties</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container mt-n5 position-relative" style={{ zIndex: 10 }}>
        <SearchBar onSearch={handleSearch} initialFilters={filters} />
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container">
          {/* Toolbar */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div>
              <p className="mb-0 text-muted">
                Showing <strong>{displayedProperties.length}</strong> properties
                {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="btn btn-link text-danger p-0 ms-3"
                  >
                    Clear Filters <X />
                  </button>
                )}
              </p>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              {/* Sort Dropdown */}
              <div className="d-flex align-items-center gap-2">
                <SortDown className="text-muted" />
                <select 
                  className="form-select form-select-sm" 
                  style={{ width: 'auto' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="area">Largest Area</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="btn-group">
                <button 
                  className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <Grid3x3Gap />
                </button>
                <button 
                  className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <ListUl />
                </button>
              </div>

              {/* Mobile Filter Toggle */}
              <button 
                className="btn btn-outline-secondary btn-sm d-lg-none"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Funnel /> Filters
              </button>
            </div>
          </div>

          {/* Properties Grid */}
          {error && <div className="alert alert-danger">{error}</div>}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner"></div>
              <p className="mt-3 text-muted">Loading properties...</p>
            </div>
          ) : displayedProperties.length > 0 ? (
            <div className={`row g-4 ${viewMode === 'list' ? 'row-cols-1' : 'row-cols-1 row-cols-md-2 row-cols-lg-3'}`}>
              {displayedProperties.map((property, index) => (
                <div key={property._id} className="col fade-in visible" style={{ animationDelay: `${index * 0.1}s` }}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="mb-4">
                <Building size={64} className="text-muted" />
              </div>
              <h3>No Properties Found</h3>
              <p className="text-muted">
                Try adjusting your search filters to find what you are looking for.
              </p>
              <button onClick={clearFilters} className="btn btn-primary-custom">
                Clear Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {displayedProperties.length > 0 && (
            <div className="pagination">
              <button className="pagination-item" disabled>&laquo;</button>
              <button className="pagination-item active">1</button>
              <button className="pagination-item">2</button>
              <button className="pagination-item">3</button>
              <button className="pagination-item">&raquo;</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Properties;
