/**
 * PropertyCard Component
 * Displays individual property information with hover effects
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GeoAlt, 
  Heart, 
  HeartFill,
  Rulers,
  DoorOpen,
  Water
} from 'react-bootstrap-icons';

function PropertyCard({ property, onFavorite }) {
  const [isFavorite, setIsFavorite] = useState(property.isFavorite || false);
  const propertyId = property._id || property.id;
  const listingType = property.listingType || property.listing_type;
  const address = typeof property.address === 'string' ? property.address : property.address?.street;
  const city = property.city || property.address?.city;
  const bedrooms = property.bedrooms ?? property.features?.bedrooms ?? 0;
  const bathrooms = property.bathrooms ?? property.features?.bathrooms ?? 0;
  const area = property.area ?? property.features?.area ?? 0;

  // Format price with commas
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Handle favorite toggle
  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    if (onFavorite) {
      onFavorite(propertyId, !isFavorite);
    }
  };

  // Default placeholder image
  const defaultImage = `data:image/svg+xml;utf8,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='#e2e8f0'/><text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' fill='#64748b' font-size='26' font-family='Arial'>No property image uploaded</text></svg>"
  )}`;

  return (
    <div className="property-card">
      {/* Property Image */}
      <div className="property-card-image">
        <img 
          src={property.images?.[0] || defaultImage} 
          alt={property.title}
          loading="lazy"
        />
        
        {/* Property Badge */}
        <span className={`property-badge ${listingType?.toLowerCase()}`}>
          {listingType === 'sale' ? 'For Sale' : 'For Rent'}
        </span>
        
        {/* Featured Badge */}
        {property.featured && (
          <span className="property-badge featured" style={{ left: 'auto', right: '60px' }}>
            Featured
          </span>
        )}

        {/* Favorite Button */}
        <button 
          className={`property-favorite ${isFavorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? <HeartFill /> : <Heart />}
        </button>
      </div>

      {/* Property Details */}
      <div className="property-card-body">
        <div className="property-price">
          {formatPrice(property.price)}
          {listingType === 'rent' && <span>/month</span>}
        </div>
        
        <h3 className="property-title">{property.title}</h3>
        
        <div className="property-location">
          <GeoAlt />
          <span>{address}, {city}</span>
        </div>

        {/* Property Features */}
        <div className="property-features">
          <div className="property-feature">
            <DoorOpen />
            <span>{bedrooms} Beds</span>
          </div>
          <div className="property-feature">
            <Water />
            <span>{bathrooms} Baths</span>
          </div>
          <div className="property-feature">
            <Rulers />
            <span>{area} sqft</span>
          </div>
        </div>

        {/* View Details Button */}
        <Link 
          to={`/properties/${propertyId}`} 
          className="btn btn-outline-gold w-100 mt-3"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default PropertyCard;
