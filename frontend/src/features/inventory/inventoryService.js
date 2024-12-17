import axios from 'axios'

const API_URL = '/api/inventory/'

const getInventory = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

const inventoryService = {
  getInventory
}

export default inventoryService 