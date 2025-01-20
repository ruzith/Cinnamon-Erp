import axios from 'axios'

const API_URL = '/api/assets/'

// Get all assets
const getAssets = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

// Create new asset
const createAsset = async (assetData) => {
  const response = await axios.post(API_URL, assetData)
  return response.data
}

// Update asset
const updateAsset = async (id, assetData) => {
  const response = await axios.put(API_URL + id, assetData)
  return response.data
}

// Delete asset
const deleteAsset = async (id) => {
  const response = await axios.delete(API_URL + id)
  return response.data
}

// Get asset depreciation
const getAssetDepreciation = async (id) => {
  const response = await axios.get(`${API_URL}${id}/depreciation`)
  return response.data
}

// Get asset value report
const getAssetValueReport = async () => {
  const response = await axios.get(`${API_URL}report/values`)
  return response.data
}

// Get asset usage report
const getAssetUsageReport = async () => {
  const response = await axios.get(`${API_URL}report/usage`)
  return response.data
}

const assetService = {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetDepreciation,
  getAssetValueReport,
  getAssetUsageReport
}

export default assetService