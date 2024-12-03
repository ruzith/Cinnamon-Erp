import axios from 'axios';

const API_URL = '/api/sales/';

// Get all invoices
const getInvoices = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Create invoice
const createInvoice = async (invoiceData) => {
  const response = await axios.post(API_URL, invoiceData);
  return response.data;
};

// Update invoice
const updateInvoice = async (id, invoiceData) => {
  const response = await axios.put(API_URL + id, invoiceData);
  return response.data;
};

const salesService = {
  getInvoices,
  createInvoice,
  updateInvoice
};

export default salesService; 