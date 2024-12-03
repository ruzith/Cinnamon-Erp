import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportService from './reportService';

const initialState = {
  templates: [],
  currentReport: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get report templates
export const getReportTemplates = createAsyncThunk(
  'reports/getTemplates',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await reportService.getTemplates(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Generate report
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
    reset: (state) => initialState,
    setCurrentReport: (state, action) => {
      state.currentReport = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getReportTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.currentReport = action.payload;
      });
  }
});

export const { reset, setCurrentReport } = reportSlice.actions;
export default reportSlice.reducer; 