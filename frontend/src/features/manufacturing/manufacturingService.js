import axios from 'axios'

const API_URL = '/api/manufacturing/'

const getManufacturing = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

const manufacturingService = {
  getManufacturing
}

export default manufacturingService 