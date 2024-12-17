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

// Delete designation
const deleteDesignation = async (id) => {
  const response = await axios.delete(API_URL + id);
  return response.data;
};

const designationService = {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation
};

export default designationService; 