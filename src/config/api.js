/**
 * API Configuration
 * Central configuration for backend API connection
 */

import axios from 'axios';

// API Base URL - Points to Flask backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Return the data directly for successful responses
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh the token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          const { access_token } = response.data.data;
          localStorage.setItem('access_token', access_token);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - Clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - Redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
    return Promise.reject(new Error(errorMessage));
  }
);

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // Properties
  PROPERTIES: {
    BASE: '/properties',
    FEATURED: '/properties/featured',
    STATS: '/properties/stats',
    SINGLE: (id) => `/properties/${id}`,
    FAVORITE: (id) => `/properties/${id}/favorite`,
  },
  
  // Agents
  AGENTS: {
    BASE: '/agents',
    FEATURED: '/agents/featured',
    SINGLE: (id) => `/agents/${id}`,
    REVIEW: (id) => `/agents/${id}/review`,
  },
  
  // Transactions
  TRANSACTIONS: {
    BASE: '/transactions',
    STATS: '/transactions/stats',
    SINGLE: (id) => `/transactions/${id}`,
  },
  
  // Clients
  CLIENTS: {
    BASE: '/clients',
    STATS: '/clients/stats',
    SINGLE: (id) => `/clients/${id}`,
    NOTES: (id) => `/clients/${id}/notes`,
  },
  
  // Dashboard
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    REVENUE: '/dashboard/analytics/revenue',
    PROPERTIES: '/dashboard/analytics/properties',
    PERFORMANCE: '/dashboard/analytics/performance',
    ACTIVITY: '/dashboard/activity',
  },
  
  // Contact
  CONTACT: {
    SUBMIT: '/contact/submit',
    PROPERTY_INQUIRY: '/contact/property-inquiry',
    AGENT_INQUIRY: '/contact/agent-inquiry',
    INQUIRIES: '/contact/inquiries',
    SINGLE: (id) => `/contact/inquiries/${id}`,
  },
  
  // Health Check
  HEALTH: '/health',
};

// Helper function to build query strings
export const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  return query.toString() ? `?${query.toString()}` : '';
};

export default api;
