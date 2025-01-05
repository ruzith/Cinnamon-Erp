import axios from 'axios';

const API_URL = '/api/customers/';

// Get all customers
const getCustomers = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Create new customer
const createCustomer = async (customerData) => {
  const response = await axios.post(API_URL, customerData);
  return response.data;
};

// Update customer
const updateCustomer = async (id, customerData) => {
  const response = await axios.put(`${API_URL}${id}`, customerData);
  return response.data;
};

// Delete customer
const deleteCustomer = async (id) => {
  const response = await axios.delete(`${API_URL}${id}`);
  return response.data;
};

const customerService = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

export default customerService;