/**
 * Property Service
 * Handles all property-related API calls
 * Ready for Flask backend integration
 */

import axios from 'axios';
import { getToken } from './authService';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Get all properties with optional filters
 * @param {object} filters - Search filters
 * @returns {Promise<Array>}
 */
export const getProperties = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await api.get(`/properties?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch properties.'
    );
  }
};

/**
 * Get single property by ID
 * @param {string} id - Property ID
 * @returns {Promise<object>}
 */
export const getPropertyById = async (id) => {
  try {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch property details.'
    );
  }
};

/**
 * Create new property
 * @param {object} propertyData - Property data
 * @returns {Promise<object>}
 */
export const createProperty = async (propertyData) => {
  try {
    const response = await api.post('/properties', propertyData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to create property.'
    );
  }
};

/**
 * Update property
 * @param {string} id - Property ID
 * @param {object} propertyData - Updated property data
 * @returns {Promise<object>}
 */
export const updateProperty = async (id, propertyData) => {
  try {
    const response = await api.put(`/properties/${id}`, propertyData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to update property.'
    );
  }
};

/**
 * Delete property
 * @param {string} id - Property ID
 * @returns {Promise<object>}
 */
export const deleteProperty = async (id) => {
  try {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to delete property.'
    );
  }
};

/**
 * Upload property images
 * @param {string} propertyId - Property ID
 * @param {FormData} formData - Form data with images
 * @returns {Promise<object>}
 */
export const uploadPropertyImages = async (propertyId, formData) => {
  try {
    const response = await api.post(`/properties/${propertyId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to upload images.'
    );
  }
};

/**
 * Get featured properties
 * @returns {Promise<Array>}
 */
export const getFeaturedProperties = async () => {
  try {
    const response = await api.get('/properties/featured');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch featured properties.'
    );
  }
};

/**
 * Add property to favorites
 * @param {string} propertyId - Property ID
 * @returns {Promise<object>}
 */
export const addToFavorites = async (propertyId) => {
  try {
    const response = await api.post(`/properties/${propertyId}/favorite`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to add to favorites.'
    );
  }
};

/**
 * Remove property from favorites
 * @param {string} propertyId - Property ID
 * @returns {Promise<object>}
 */
export const removeFromFavorites = async (propertyId) => {
  try {
    const response = await api.delete(`/properties/${propertyId}/favorite`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to remove from favorites.'
    );
  }
};

/**
 * Get user's favorite properties
 * @returns {Promise<Array>}
 */
export const getFavoriteProperties = async () => {
  try {
    const response = await api.get('/properties/favorites');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch favorites.'
    );
  }
};

/**
 * Search properties
 * @param {string} query - Search query
 * @returns {Promise<Array>}
 */
export const searchProperties = async (query) => {
  try {
    const response = await api.get(`/properties/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Search failed.'
    );
  }
};

export default {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  getFeaturedProperties,
  addToFavorites,
  removeFromFavorites,
  getFavoriteProperties,
  searchProperties
};
