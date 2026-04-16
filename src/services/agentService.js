/**
 * Agent Service
 * Handles all agent-related API calls
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
 * Get all agents
 * @param {object} filters - Optional filters (specialization, etc.)
 * @returns {Promise<Array>}
 */
export const getAgents = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await api.get(`/agents?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch agents.'
    );
  }
};

/**
 * Get featured agents
 * @param {number} limit
 * @returns {Promise<object>}
 */
export const getFeaturedAgents = async (limit = 6) => {
  try {
    const response = await api.get(`/agents/featured?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch featured agents.'
    );
  }
};

/**
 * Get single agent by ID
 * @param {string} id - Agent ID
 * @returns {Promise<object>}
 */
export const getAgentById = async (id) => {
  try {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch agent details.'
    );
  }
};

/**
 * Create new agent (Admin only)
 * @param {object} agentData - Agent data
 * @returns {Promise<object>}
 */
export const createAgent = async (agentData) => {
  try {
    const response = await api.post('/agents', agentData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to create agent.'
    );
  }
};

/**
 * Update agent
 * @param {string} id - Agent ID
 * @param {object} agentData - Updated agent data
 * @returns {Promise<object>}
 */
export const updateAgent = async (id, agentData) => {
  try {
    const response = await api.put(`/agents/${id}`, agentData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to update agent.'
    );
  }
};

/**
 * Delete agent (Admin only)
 * @param {string} id - Agent ID
 * @returns {Promise<object>}
 */
export const deleteAgent = async (id) => {
  try {
    const response = await api.delete(`/agents/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to delete agent.'
    );
  }
};

/**
 * Get agent's properties
 * @param {string} agentId - Agent ID
 * @returns {Promise<Array>}
 */
export const getAgentProperties = async (agentId) => {
  try {
    const response = await api.get(`/agents/${agentId}/properties`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch agent properties.'
    );
  }
};

/**
 * Assign property to agent
 * @param {string} agentId - Agent ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<object>}
 */
export const assignPropertyToAgent = async (agentId, propertyId) => {
  try {
    const response = await api.post(`/agents/${agentId}/properties`, { propertyId });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to assign property.'
    );
  }
};

/**
 * Get top performing agents
 * @param {number} limit - Number of agents to return
 * @returns {Promise<Array>}
 */
export const getTopAgents = async (limit = 6) => {
  try {
    const response = await api.get(`/agents/top?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch top agents.'
    );
  }
};

/**
 * Contact agent
 * @param {string} agentId - Agent ID
 * @param {object} messageData - Contact message data
 * @returns {Promise<object>}
 */
export const contactAgent = async (agentId, messageData) => {
  try {
    const response = await api.post(`/agents/${agentId}/contact`, messageData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to send message to agent.'
    );
  }
};

export default {
  getAgents,
  getFeaturedAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  getAgentProperties,
  assignPropertyToAgent,
  getTopAgents,
  contactAgent
};
