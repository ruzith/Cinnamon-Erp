import axios from 'axios'

const API_URL = '/api/reports/'

const getReports = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

const reportService = {
  getReports
}

export default reportService 