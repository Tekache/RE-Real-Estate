/**
 * Signup Page Component
 * User registration with form validation
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, Google, Facebook, Check, X } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'client',
    agreeTerms: false
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Password strength check
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const colors = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

    return { score, label: labels[score], color: colors[score] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setApiError('');
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phone && !/^[\d\s\-+()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Please choose a stronger password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');

    try {
      // Call register API via auth context
      const result = await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role
      });
      
      if (result.success) {
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setApiError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setApiError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '500px' }}>
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">RE</div>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join our real estate platform today</p>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="alert alert-danger">
              {apiError}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} id="signup-form" noValidate>
            {/* Name Fields */}
            <div className="d-flex gap-3">
              <div className="form-group flex-fill">
                <label htmlFor="first_name" className="form-label">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  className={`form-control-custom ${errors.first_name ? 'is-invalid' : ''}`}
                  placeholder="First name"
                  value={formData.first_name}
                  onChange={handleChange}
                  autoComplete="given-name"
                />
                {errors.first_name && (
                  <div className="invalid-feedback">{errors.first_name}</div>
                )}
              </div>
              <div className="form-group flex-fill">
                <label htmlFor="last_name" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  className={`form-control-custom ${errors.last_name ? 'is-invalid' : ''}`}
                  placeholder="Last name"
                  value={formData.last_name}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
                {errors.last_name && (
                  <div className="invalid-feedback">{errors.last_name}</div>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control-custom ${errors.email ? 'is-invalid' : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>

            {/* Phone Field */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number (Optional)</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`form-control-custom ${errors.phone ? 'is-invalid' : ''}`}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
              {errors.phone && (
                <div className="invalid-feedback">{errors.phone}</div>
              )}
            </div>

            {/* Role Selection */}
            <div className="form-group">
              <label htmlFor="role" className="form-label">I want to</label>
              <select
                id="role"
                name="role"
                className="form-control-custom"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="client">Buy/Rent a Property</option>
                <option value="agent">List Properties as Agent</option>
              </select>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`form-control-custom ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute text-muted"
                  style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlash /> : <Eye />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="d-flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          background: i <= passwordStrength.score ? passwordStrength.color : '#e2e8f0'
                        }}
                      />
                    ))}
                  </div>
                  <small style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </small>
                </div>
              )}
              
              {errors.password && (
                <div className="invalid-feedback d-block">{errors.password}</div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="position-relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-control-custom ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute text-muted"
                  style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeSlash /> : <Eye />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-1">
                  {formData.password === formData.confirmPassword ? (
                    <small className="text-success d-flex align-items-center gap-1">
                      <Check /> Passwords match
                    </small>
                  ) : (
                    <small className="text-danger d-flex align-items-center gap-1">
                      <X /> Passwords do not match
                    </small>
                  )}
                </div>
              )}
              
              {errors.confirmPassword && (
                <div className="invalid-feedback d-block">{errors.confirmPassword}</div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="form-group">
              <div className="form-check">
                <input
                  type="checkbox"
                  className={`form-check-input ${errors.agreeTerms ? 'is-invalid' : ''}`}
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="agreeTerms">
                  I agree to the{' '}
                  <a href="/terms" className="text-gold">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-gold">Privacy Policy</a>
                </label>
              </div>
              {errors.agreeTerms && (
                <div className="invalid-feedback d-block">{errors.agreeTerms}</div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary-custom w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Social Signup Divider */}
          <div className="auth-divider">
            <span>or sign up with</span>
          </div>

          {/* Social Signup Buttons */}
          <div className="d-flex gap-3">
            <button className="btn btn-outline-secondary flex-fill">
              <Google className="me-2" /> Google
            </button>
            <button className="btn btn-outline-secondary flex-fill">
              <Facebook className="me-2" /> Facebook
            </button>
          </div>

          {/* Login Link */}
          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
