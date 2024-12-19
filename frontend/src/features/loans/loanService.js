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

const loanService = {
  getLoans,
  getLoanDetails,
  updateLoanStatus
}

export default loanService 