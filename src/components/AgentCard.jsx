/**
 * AgentCard Component
 * Displays agent profile with stats and contact options
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Telephone, 
  Envelope, 
  Linkedin,
  StarFill
} from 'react-bootstrap-icons';

function AgentCard({ agent }) {
  // Default avatar placeholder
  const defaultAvatar = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80';
  const agentId = agent._id || agent.id;
  const specialization = agent.specialization
    || (Array.isArray(agent.specializations) ? agent.specializations.join(', ') : null)
    || 'Real Estate Agent';
  const rating = agent.rating ?? agent.stats?.average_rating;
  const reviewCount = agent.reviewCount ?? agent.stats?.total_reviews ?? 0;
  const propertiesCount = agent.propertiesCount ?? agent.active_listings ?? 0;
  const salesCount = agent.salesCount ?? (
    (agent.stats?.properties_sold || 0) + (agent.stats?.properties_rented || 0)
  );

  return (
    <div className="agent-card">
      {/* Agent Avatar */}
      <img 
        src={agent.avatar || defaultAvatar} 
        alt={agent.name}
        className="agent-avatar"
        loading="lazy"
      />

      {/* Agent Info */}
      <h3 className="agent-name">{agent.name}</h3>
      <p className="agent-role">{specialization}</p>

      {/* Rating */}
      {rating && (
        <div className="d-flex justify-content-center align-items-center gap-1 mb-3">
          {[...Array(5)].map((_, index) => (
            <StarFill 
              key={index} 
              className={index < Math.floor(rating) ? 'text-gold' : 'text-muted'} 
              size={14}
            />
          ))}
          <span className="ms-2 text-muted">({reviewCount})</span>
        </div>
      )}

      {/* Agent Stats */}
      <div className="agent-stats">
        <div className="agent-stat">
          <div className="agent-stat-value">{propertiesCount}</div>
          <div className="agent-stat-label">Properties</div>
        </div>
        <div className="agent-stat">
          <div className="agent-stat-value">{salesCount}</div>
          <div className="agent-stat-label">Sales</div>
        </div>
      </div>

      {/* Contact Buttons */}
      <div className="agent-contact">
        <a 
          href={`tel:${agent.phone}`} 
          className="agent-contact-btn"
          aria-label="Call agent"
        >
          <Telephone />
        </a>
        <a 
          href={`mailto:${agent.email}`} 
          className="agent-contact-btn"
          aria-label="Email agent"
        >
          <Envelope />
        </a>
        {agent.linkedin && (
          <a 
            href={agent.linkedin} 
            className="agent-contact-btn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
          >
            <Linkedin />
          </a>
        )}
      </div>

      {/* View Profile Button */}
      <Link 
        to={`/agents/${agentId}`}
        className="btn btn-primary-custom w-100 mt-3"
      >
        View Profile
      </Link>
    </div>
  );
}

export default AgentCard;
