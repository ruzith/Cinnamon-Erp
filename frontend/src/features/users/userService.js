import axios from 'axios';

const API_URL = '/api/users/';

// Get users
const getUsers = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Create user
const createUser = async (userData) => {
  const response = await axios.post(API_URL, userData);
  return response.data;
};

// Update user
const updateUser = async (id, userData) => {
  const response = await axios.put(`${API_URL}${id}`, userData);
  return response.data;
};

// Delete user
const deleteUser = async (id, permanent = false) => {
  const response = await axios.delete(`${API_URL}${id}${permanent ? '?permanent=true' : ''}`);
  return response.data;
};

const userService = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};

export default userService;