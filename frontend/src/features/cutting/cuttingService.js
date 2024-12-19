import axios from 'axios'

const API_URL = '/api/cutting/'

const getContractors = async () => {
  const response = await axios.get(API_URL + 'contractors')
  return response.data
}

const createContractor = async (contractorData) => {
  const response = await axios.post(API_URL + 'contractors', contractorData)
  return response.data
}

const cuttingService = {
  getContractors,
  createContractor
}

export default cuttingService 