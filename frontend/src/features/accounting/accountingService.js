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

const accountingService = {
  getTransactions,
  createTransaction
}

export default accountingService 