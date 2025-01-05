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

    // Use correct file extension based on format
    const extension = params.format === 'excel' ? 'xlsx' : params.format;
    link.setAttribute('download', `report_${code}_${Date.now()}.${extension}`);

    document.body.appendChild(link);
    link.click();
    link.remove();
    return null;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to generate report';
  }
};

// Get report preview
const getReportPreview = async (code, params, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    const response = await axios.post(
      API_URL + `preview/${code}`,
      { ...params, format: 'json' },
      config
    );

    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to get report preview';
  }
};

const reportService = {
  getTemplates,
  generateReport,
  getReportPreview
}

export default reportService