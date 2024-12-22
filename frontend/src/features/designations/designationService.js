import axios from 'axios';

const API_URL = '/api/designations/';

// Get designations
const getDesignations = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Create designation
const createDesignation = async (designationData) => {
  const response = await axios.post(API_URL, designationData);
  return response.data;
};

// Update designation
const updateDesignation = async (id, designationData) => {
  const response = await axios.put(API_URL + id, designationData);
  return response.data;
};

// Delete designation with optional force delete and reassignment
const deleteDesignation = async (id, options = {}) => {
  const queryParams = options.forceDelete && options.newDesignationId 
    ? `?forceDelete=true&newDesignationId=${options.newDesignationId}`
    : '';
  const response = await axios.delete(API_URL + id + queryParams);
  return response.data;
};

// Add new method for reassignment
const reassignEmployees = async (id, newDesignationId) => {
  const response = await axios.put(`${API_URL}${id}/reassign`, { newDesignationId });
  return response.data;
};

const designationService = {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  reassignEmployees
};

export default designationService; 