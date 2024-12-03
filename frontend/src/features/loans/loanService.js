import axios from 'axios'

const API_URL = '/api/loans/'

const getLoans = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

const loanService = {
  getLoans
}

export default loanService 