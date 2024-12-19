import axios from 'axios'

const API_URL = '/api/loans/'

const getLoans = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

const getLoanDetails = async (id) => {
  const response = await axios.get(`${API_URL}${id}`)
  return response.data
}

const updateLoanStatus = async (id, status) => {
  const response = await axios.patch(`${API_URL}${id}/status`, { status })
  return response.data
}

const createLoan = async (loanData) => {
  const response = await axios.post(API_URL, loanData)
  return response.data
}

const recordPayment = async (loanId, paymentData) => {
  const response = await axios.post(`${API_URL}${loanId}/payments`, paymentData)
  return response.data
}

const getLoanSchedule = async (loanId) => {
  const response = await axios.get(`${API_URL}${loanId}/schedule`)
  return response.data
}

const getBorrowers = async (type) => {
  const response = await axios.get(`${API_URL}borrowers?type=${type}`)
  return response.data
}

const loanService = {
  getLoans,
  getLoanDetails,
  updateLoanStatus,
  createLoan,
  recordPayment,
  getLoanSchedule,
  getBorrowers
}

export default loanService 