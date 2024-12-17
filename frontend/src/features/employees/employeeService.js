import axios from 'axios';

const API_URL = '/api/employees/';

// Get employees
const getEmployees = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Create employee
const createEmployee = async (employeeData) => {
  const response = await axios.post(API_URL, employeeData);
  return response.data;
};

// Update employee
const updateEmployee = async (id, employeeData) => {
  const response = await axios.put(API_URL + id, employeeData);
  return response.data;
};

// Delete employee
const deleteEmployee = async (id) => {
  const response = await axios.delete(API_URL + id);
  return response.data;
};

const employeeService = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};

export default employeeService; 