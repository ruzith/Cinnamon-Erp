import axios from 'axios';

const API_URL = '/api/lands/';

// Get lands
const getLands = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Clear local storage and user data if token is invalid
      localStorage.removeItem('user');
      throw new Error('Session expired - please login again');
    }
    throw error;
  }
};

// Create land
const createLand = async (landData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    const response = await axios.post(API_URL, landData, config);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      throw new Error('Session expired - please login again');
    }
    throw error;
  }
};

// Update land
const updateLand = async ({ id, landData }, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    const response = await axios.put(API_URL + id, landData, config);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      throw new Error('Session expired - please login again');
    }
    throw error;
  }
};

// Delete land
const deleteLand = async (id, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    const response = await axios.delete(`${API_URL}${id}`, config);
    return { id }; // Return the id for the reducer to use
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      throw new Error('Session expired - please login again');
    }
    throw error;
  }
};

const landService = {
  getLands,
  createLand,
  updateLand,
  deleteLand
};

export default landService; 