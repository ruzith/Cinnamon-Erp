import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportService from './reportService';
import reportTemplates from '../../data/reportTemplates';

const initialState = {
  templates: [],
  currentReport: null,
  isLoading: false,
  isError: false,
  message: ''
};

export const getReportTemplates = createAsyncThunk(
  'reports/getTemplates',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) {
        throw new Error('No authentication token available');
      }
      const templates = await reportService.getTemplates(token);
      if (!templates || templates.length === 0) {
        console.warn('No templates received from API');
        return reportTemplates;
      }
      return templates;
    } catch (error) {
      console.error('Error in getReportTemplates:', error);
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch templates'
      );
    }
  }
);

export const generateReport = createAsyncThunk(
  'reports/generate',
  async ({ code, params }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await reportService.generateReport(code, params, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    reset: (state) => ({
      ...initialState,
      templates: reportTemplates || []
    }),
    setCurrentReport: (state, action) => {
      state.currentReport = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getReportTemplates.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getReportTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.templates = action.payload || reportTemplates || [];
      })
      .addCase(getReportTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.templates = reportTemplates || [];
      })
      .addCase(generateReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentReport = action.payload;
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, setCurrentReport } = reportSlice.actions;
export default reportSlice.reducer; 