import axios from 'axios';

// Get grades
const getGrades = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get('/api/purchases/grades', config);
  return response.data;
};

// Create invoice
const createInvoice = async (invoiceData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.post('/api/purchases/invoices', invoiceData, config);
  return response.data;
};

// Update invoice
const updateInvoice = async (id, invoiceData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.put(`/api/purchases/invoices/${id}`, invoiceData, config);
  return response.data;
};

// Get contractor invoices
const getContractorInvoices = async (contractorId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(`/api/purchases/invoices/contractor/${contractorId}`, config);
  return response.data;
};

// Get contractor advance payments
const getContractorAdvancePayments = async (contractorId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const response = await axios.get(`/api/purchases/advance-payments/contractor/${contractorId}`, config);
  return response.data;
};

const purchaseService = {
  getGrades,
  createInvoice,
  updateInvoice,
  getContractorInvoices,
  getContractorAdvancePayments
};

export default purchaseService;