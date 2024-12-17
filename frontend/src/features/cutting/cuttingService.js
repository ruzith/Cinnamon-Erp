import axios from 'axios'

const API_URL = '/api/cutting/'

const getCuttings = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

const createCutting = async (cuttingData) => {
  const response = await axios.post(API_URL, cuttingData)
  return response.data
}

const cuttingService = {
  getCuttings,
  createCutting
}

export default cuttingService 