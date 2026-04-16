/**
 * Authentication Context
 * Provides global authentication state and methods
 */
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ENDPOINTS } from '../config/api';

// Create context
const AuthContext = createContext(null);

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const clearAuthState = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Logout function
  const logout = useCallback((redirect = true) => {
    clearAuthState();
    if (redirect) {
      navigate('/login');
    }
  }, [clearAuthState, navigate]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          
          // Verify token is still valid
          const response = await api.get(ENDPOINTS.AUTH.ME);
          if (response.success) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch {
          // Token invalid, clear auth state
          logout(false);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [logout]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
      
      if (response.success) {
        const { user: userData, access_token, refresh_token } = response.data;
        
        // Store tokens and user
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.REGISTER, userData);
      
      if (response.success) {
        const { user: newUser, access_token, refresh_token } = response.data;
        
        // Store tokens and user
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, user: newUser };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await api.put(ENDPOINTS.AUTH.PROFILE, profileData);
      
      if (response.success) {
        const updatedUser = response.data;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      return { success: response.success, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  // Check if user has a specific role
  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);

  // Check if user is agent
  const isAgent = useCallback(() => hasRole(['agent', 'admin']), [hasRole]);

  // Context value
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    isAdmin,
    isAgent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route component
export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
    
    if (!loading && isAuthenticated && roles && user) {
      const hasRequiredRole = Array.isArray(roles) 
        ? roles.includes(user.role)
        : user.role === roles;
      
      if (!hasRequiredRole) {
        navigate('/', { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, roles, navigate]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roles && user) {
    const hasRequiredRole = Array.isArray(roles) 
      ? roles.includes(user.role)
      : user.role === roles;
    
    if (!hasRequiredRole) {
      return null;
    }
  }

  return children;
}
