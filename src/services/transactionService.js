/**
 * Transaction Service
 * Handles all transaction-related API calls
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
 * Get all transactions
 * @param {object} filters - Optional filters (type, status, dateRange)
 * @returns {Promise<Array>}
 */
export const getTransactions = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch transactions.'
    );
  }
};

/**
 * Get single transaction by ID
 * @param {string} id - Transaction ID
 * @returns {Promise<object>}
 */
export const getTransactionById = async (id) => {
  try {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch transaction details.'
    );
  }
};

/**
 * Create new transaction
 * @param {object} transactionData - Transaction data
 * @returns {Promise<object>}
 */
export const createTransaction = async (transactionData) => {
  try {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to create transaction.'
    );
  }
};

/**
 * Update transaction
 * @param {string} id - Transaction ID
 * @param {object} transactionData - Updated transaction data
 * @returns {Promise<object>}
 */
export const updateTransaction = async (id, transactionData) => {
  try {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to update transaction.'
    );
  }
};

/**
 * Delete transaction
 * @param {string} id - Transaction ID
 * @returns {Promise<object>}
 */
export const deleteTransaction = async (id) => {
  try {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to delete transaction.'
    );
  }
};

/**
 * Get transaction statistics
 * @param {string} period - Time period (week, month, year)
 * @returns {Promise<object>}
 */
export const getTransactionStats = async (period = 'month') => {
  try {
    const response = await api.get(`/transactions/stats?period=${period}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch transaction statistics.'
    );
  }
};

/**
 * Get recent transactions
 * @param {number} limit - Number of transactions to return
 * @returns {Promise<Array>}
 */
export const getRecentTransactions = async (limit = 10) => {
  try {
    const response = await api.get(`/transactions/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch recent transactions.'
    );
  }
};

/**
 * Update transaction status
 * @param {string} id - Transaction ID
 * @param {string} status - New status
 * @returns {Promise<object>}
 */
export const updateTransactionStatus = async (id, status) => {
  try {
    const response = await api.patch(`/transactions/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to update transaction status.'
    );
  }
};

/**
 * Get transactions by property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>}
 */
export const getTransactionsByProperty = async (propertyId) => {
  try {
    const response = await api.get(`/transactions/property/${propertyId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch property transactions.'
    );
  }
};

/**
 * Get transactions by client
 * @param {string} clientId - Client ID
 * @returns {Promise<Array>}
 */
export const getTransactionsByClient = async (clientId) => {
  try {
    const response = await api.get(`/transactions/client/${clientId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch client transactions.'
    );
  }
};

/**
 * Export transactions report
 * @param {object} filters - Report filters
 * @param {string} format - Export format (csv, pdf)
 * @returns {Promise<Blob>}
 */
export const exportTransactions = async (filters = {}, format = 'csv') => {
  try {
    const params = new URLSearchParams(filters);
    params.append('format', format);
    
    const response = await api.get(`/transactions/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to export transactions.'
    );
  }
};

export default {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getRecentTransactions,
  updateTransactionStatus,
  getTransactionsByProperty,
  getTransactionsByClient,
  exportTransactions
};
