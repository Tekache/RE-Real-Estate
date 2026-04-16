
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, Google, Facebook } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      // Call login API via auth context
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setApiError(result.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      setApiError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo login (for testing without backend)
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // Try demo credentials
      const result = await login('admin@realestate.com', 'Admin123!');
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        // Fallback for when backend is not available
        const demoUser = {
          id: 'demo123',
          first_name: 'Demo',
          last_name: 'Admin',
          email: 'demo@realestate.com',
          role: 'admin'
        };
        
        localStorage.setItem('access_token', 'demo-token-123');
        localStorage.setItem('user', JSON.stringify(demoUser));
        navigate('/dashboard');
        window.location.reload();
      }
    } catch {
      // Fallback demo login
      const demoUser = {
        id: 'demo123',
        first_name: 'Demo',
        last_name: 'Admin',
        email: 'demo@realestate.com',
        role: 'admin'
      };
      
      localStorage.setItem('access_token', 'demo-token-123');
      localStorage.setItem('user', JSON.stringify(demoUser));
      navigate('/dashboard');
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">RE</div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account to continue</p>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="alert alert-danger">
              {apiError}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} id="login-form" noValidate>
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

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`form-control-custom ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
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
              {errors.password && (
                <div className="invalid-feedback d-block">{errors.password}</div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="remember"
                  name="remember"
                />
                <label className="form-check-label" htmlFor="remember">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-gold">
                Forgot Password?
              </Link>
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Login Button */}
          {/* <button
            type="button"
            className="btn btn-outline-secondary w-100 mt-3"
            onClick={handleDemoLogin}
          >
            Demo Login (No Backend Required)
          </button> */}

          {/* Social Login Divider */}
          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          {/* Social Login Buttons */}
          {/* <div className="d-flex gap-3">
            <button className="btn btn-outline-secondary flex-fill">
              <Google className="me-2" /> Google
            </button>
            <button className="btn btn-outline-secondary flex-fill">
              <Facebook className="me-2" /> Facebook
            </button>
          </div> */}

          {/* Sign Up Link */}
          <div className="auth-footer">
            Do not have an account?{' '}
            <Link to="/signup">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
