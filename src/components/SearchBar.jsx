/**
 * SearchBar Component
 * Property search and filter functionality
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'react-bootstrap-icons';

function SearchBar({ onSearch, initialFilters = {} }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    location: initialFilters.location || '',
    propertyType: initialFilters.propertyType || '',
    listingType: initialFilters.listingType || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    bedrooms: initialFilters.bedrooms || ''
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    // Navigate to properties page with filters
    if (onSearch) {
      onSearch(filters);
    } else {
      navigate(`/properties?${queryParams.toString()}`);
    }
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-bar">
        {/* Location */}
        <div className="search-field">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="Enter city or area"
            value={filters.location}
            onChange={handleChange}
          />
        </div>

        {/* Property Type */}
        <div className="search-field">
          <label htmlFor="propertyType">Property Type</label>
          <select
            id="propertyType"
            name="propertyType"
            value={filters.propertyType}
            onChange={handleChange}
          >
            <option value="">All Types</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="condo">Condo</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
          </select>
        </div>

        {/* Listing Type */}
        <div className="search-field">
          <label htmlFor="listingType">Listing Type</label>
          <select
            id="listingType"
            name="listingType"
            value={filters.listingType}
            onChange={handleChange}
          >
            <option value="">Buy or Rent</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="search-field">
          <label htmlFor="maxPrice">Max Price</label>
          <select
            id="maxPrice"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleChange}
          >
            <option value="">Any Price</option>
            <option value="100000">$100,000</option>
            <option value="250000">$250,000</option>
            <option value="500000">$500,000</option>
            <option value="750000">$750,000</option>
            <option value="1000000">$1,000,000</option>
            <option value="2000000">$2,000,000+</option>
          </select>
        </div>

        {/* Bedrooms */}
        <div className="search-field">
          <label htmlFor="bedrooms">Bedrooms</label>
          <select
            id="bedrooms"
            name="bedrooms"
            value={filters.bedrooms}
            onChange={handleChange}
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>

        {/* Search Button */}
        <button type="submit" className="search-btn">
          <Search /> Search
        </button>
      </form>
    </div>
  );
}

export default SearchBar;
