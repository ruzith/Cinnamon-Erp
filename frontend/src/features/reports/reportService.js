import axios from 'axios'
import reportTemplates from '../../data/reportTemplates'; // Updated import path

const API_URL = '/api/reports/'

// Get report templates
const getTemplates = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    const response = await axios.get(API_URL + 'templates', config);
    return response.data;
  } catch (error) {
    console.error('Error in getTemplates:', error);
    // Fallback to static templates if API fails
    return reportTemplates;
  }
};

// Generate report
const generateReport = async (code, params, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: params.format === 'json' ? 'json' : 'blob'
    };
    
    const response = await axios.post(
      API_URL + `generate/${code}`,
      params,
      config
    );

    if (params.format === 'json') {
      return response.data;
    }

    // Handle file download for PDF and Excel
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${code}_${new Date().getTime()}.${params.format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return null;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to generate report';
  }
};

const reportService = {
  getTemplates,
  generateReport
}

export default reportService 