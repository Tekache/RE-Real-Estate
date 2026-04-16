/**
 * Navbar Component
 * Responsive navigation with scroll effects and authentication state
 */

import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

// Icons
import { 
  HouseDoor, 
  Building, 
  People, 
  Grid3x3Gap, 
  Envelope, 
  PersonCircle,
  BoxArrowRight,
  List,
  X
} from 'react-bootstrap-icons';

function Navbar({ user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const displayName = user
    ? user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User'
    : '';

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle logout
  const handleLogoutClick = () => {
    onLogout();
    closeMobileMenu();
  };

  return (
    <nav className={`navbar navbar-expand-lg navbar-custom ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand navbar-brand-custom">
          <div className="brand-icon">RE</div>
          Real<span>Estate</span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler navbar-toggler-custom"
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
        </button>

        {/* Navigation Menu */}
        <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <NavLink 
                to="/" 
                className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <HouseDoor className="me-1" /> Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                to="/properties" 
                className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <Building className="me-1" /> Properties
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                to="/agents" 
                className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <People className="me-1" /> Agents
              </NavLink>
            </li>
            {user && (
              <li className="nav-item">
                <NavLink 
                  to="/dashboard" 
                  className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Grid3x3Gap className="me-1" /> Dashboard
                </NavLink>
              </li>
            )}
            <li className="nav-item">
              <NavLink 
                to="/contact" 
                className={({ isActive }) => `nav-link nav-link-custom ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <Envelope className="me-1" /> Contact
              </NavLink>
            </li>
          </ul>

          {/* Auth Buttons */}
          <div className="nav-auth-buttons">
            {user ? (
              <>
                <div className="nav-user-info d-flex align-items-center">
                  <PersonCircle size={20} className="text-gold me-2" />
                  <span className="text-white me-3">{displayName}</span>
                </div>
                <button 
                  onClick={handleLogoutClick} 
                  className="btn btn-login d-flex align-items-center"
                >
                  <BoxArrowRight className="me-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-login" onClick={closeMobileMenu}>
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary-custom" onClick={closeMobileMenu}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
