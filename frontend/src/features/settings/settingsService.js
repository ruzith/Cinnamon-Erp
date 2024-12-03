import axios from 'axios';

const API_URL = '/api/settings/';

const getSettings = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

const updateSettings = async (data, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  };
  const response = await axios.put(API_URL, data, config);
  return response.data;
};

const addCurrency = async (data, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.post(API_URL + 'currencies', data, config);
  return response.data;
};

const editCurrency = async (data, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.put(API_URL + `currencies/${data.code}`, data, config);
  return response.data;
};

const deleteCurrency = async (code, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.delete(API_URL + `currencies/${code}`, config);
  return response.data;
};

const settingsService = {
  getSettings,
  updateSettings,
  addCurrency,
  editCurrency,
  deleteCurrency
};

export default settingsService; 