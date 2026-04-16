/**
 * Authentication Service
 * Handles login, registration, and token management
 * All requests go through the central api instance (src/config/api.js)
 */

import api, { ENDPOINTS } from '../config/api';

/**
 * Login user
 */
export const login = async (email, password) => {
  try {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
    return response;
  } catch (error) {
    throw new Error(
      error.message || 'Login failed. Please check your credentials.'
    );
  }
};

/**
 * Register new user
 */
export const register = async (userData) => {
  try {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, userData);
    return response;
  } catch (error) {
    throw new Error(
      error.message || 'Registration failed. Please try again.'
    );
  }
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

/**
 * Get authentication token
 */
export const getToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put(ENDPOINTS.AUTH.PROFILE, profileData);

    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response;
  } catch (error) {
    throw new Error(error.message || 'Profile update failed.');
  }
};

/**
 * Change password
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response;
  } catch (error) {
    throw new Error(error.message || 'Password change failed.');
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  getToken,
  updateProfile,
  changePassword,
};
