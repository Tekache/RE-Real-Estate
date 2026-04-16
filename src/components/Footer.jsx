/**
 * Footer Component
 * Contains company info, quick links, and contact details
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  GeoAlt,
  Telephone,
  Envelope,
  Clock,
  ChevronRight
} from 'react-bootstrap-icons';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="row g-4">
          {/* Company Info */}
          <div className="col-lg-4 col-md-6">
            <div className="footer-brand">
              <h3>Real<span>Estate</span></h3>
              <p className="footer-description">
                Your trusted partner in finding the perfect property. We provide comprehensive 
                real estate management solutions for property owners, agents, and clients.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook"><Facebook /></a>
                <a href="#" aria-label="Twitter"><Twitter /></a>
                <a href="#" aria-label="Instagram"><Instagram /></a>
                <a href="#" aria-label="LinkedIn"><Linkedin /></a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/"><ChevronRight size={14} /> Home</Link>
              </li>
              <li>
                <Link to="/properties"><ChevronRight size={14} /> Properties</Link>
              </li>
              <li>
                <Link to="/agents"><ChevronRight size={14} /> Our Agents</Link>
              </li>
              <li>
                <Link to="/contact"><ChevronRight size={14} /> Contact Us</Link>
              </li>
              <li>
                <Link to="/login"><ChevronRight size={14} /> Login</Link>
              </li>
            </ul>
          </div>

          {/* Property Types */}
          <div className="col-lg-2 col-md-6">
            <h4 className="footer-title">Property Types</h4>
            <ul className="footer-links">
              <li>
                <Link to="/properties?type=house"><ChevronRight size={14} /> Houses</Link>
              </li>
              <li>
                <Link to="/properties?type=apartment"><ChevronRight size={14} /> Apartments</Link>
              </li>
              <li>
                <Link to="/properties?type=villa"><ChevronRight size={14} /> Villas</Link>
              </li>
              <li>
                <Link to="/properties?type=commercial"><ChevronRight size={14} /> Commercial</Link>
              </li>
              <li>
                <Link to="/properties?type=land"><ChevronRight size={14} /> Land</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-lg-4 col-md-6">
            <h4 className="footer-title">Contact Info</h4>
            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <GeoAlt />
              </div>
              <div className="footer-contact-text">
                <strong>Address</strong>
                123 Real Estate Blvd, Suite 100<br />
                New York, NY 10001
              </div>
            </div>
            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <Telephone />
              </div>
              <div className="footer-contact-text">
                <strong>Phone</strong>
                +1 (555) 123-4567
              </div>
            </div>
            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <Envelope />
              </div>
              <div className="footer-contact-text">
                <strong>Email</strong>
                info@realestate.com
              </div>
            </div>
            <div className="footer-contact-item">
              <div className="footer-contact-icon">
                <Clock />
              </div>
              <div className="footer-contact-text">
                <strong>Working Hours</strong>
                Mon - Fri: 9:00 AM - 6:00 PM
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} RealEstate Management System. All Rights Reserved. 
            Designed for efficient property management.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
