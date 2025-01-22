import axios from 'axios'

const API_URL = '/api/accounting/'

// Get all transactions
const getTransactions = async () => {
  const response = await axios.get(API_URL + 'transactions')
  return response.data
}

// Create new transaction
const createTransaction = async (transactionData) => {
  const response = await axios.post(API_URL + 'transactions', transactionData)
  return response.data
}

// Post transaction
const postTransaction = async (id) => {
  const response = await axios.post(`${API_URL}transactions/${id}/post`)
  return response.data
}

// Get ledger entries
const getLedgerEntries = async (accountId, startDate, endDate) => {
  const response = await axios.get(
    `${API_URL}ledger/${accountId}?startDate=${startDate}&endDate=${endDate}`
  )
  return response.data
}

// Get trial balance
const getTrialBalance = async () => {
  const response = await axios.get(API_URL + 'trial-balance')
  return response.data
}

// Get balance sheet
const getBalanceSheet = async () => {
  const response = await axios.get(API_URL + 'balance-sheet')
  return response.data
}

// Get income statement
const getIncomeStatement = async (startDate, endDate) => {
  const response = await axios.get(
    `${API_URL}income-statement?startDate=${startDate}&endDate=${endDate}`
  )
  return response.data
}

// Get cash flow statement
const getCashFlow = async (startDate, endDate) => {
  const response = await axios.get(
    `${API_URL}cash-flow?startDate=${startDate}&endDate=${endDate}`
  )
  return response.data
}

// Add this new method
const getAccountingSummary = async () => {
  const response = await axios.get(API_URL + 'summary')
  return response.data
}

// Add this new method
const getCashbook = async (startDate, endDate) => {
  const response = await axios.get(
    `${API_URL}cashbook?startDate=${startDate}&endDate=${endDate}`
  );
  return response.data;
};

// Update these methods to use the new report endpoints
const getReport = async (type, startDate, endDate) => {
  const response = await axios.get(
    `${API_URL}reports/${type}?startDate=${startDate}&endDate=${endDate}`
  );
  return response.data;
};

const accountingService = {
  getTransactions,
  createTransaction,
  postTransaction,
  getLedgerEntries,
  getTrialBalance,
  getBalanceSheet,
  getIncomeStatement,
  getCashFlow,
  getAccountingSummary,
  getCashbook,
  getReport
}

export default accountingService