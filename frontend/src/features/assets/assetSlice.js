import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import assetService from './assetService';

const initialState = {
  assets: [],
  categories: [],
  maintenanceRecords: [],
  currentAsset: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get assets
export const getAssets = createAsyncThunk(
  'assets/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await assetService.getAssets(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Create asset
export const createAsset = createAsyncThunk(
  'assets/create',
  async (assetData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await assetService.createAsset(assetData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Get depreciation report
export const getDepreciationReport = createAsyncThunk(
  'assets/depreciation',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await assetService.getDepreciationReport(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const assetSlice = createSlice({
  name: 'asset',
  initialState,
  reducers: {
    reset: (state) => initialState,
    setCurrentAsset: (state, action) => {
      state.currentAsset = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAssets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAssets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.assets = action.payload;
      })
      .addCase(createAsset.fulfilled, (state, action) => {
        state.assets.unshift(action.payload);
        state.currentAsset = action.payload;
      });
  }
});

export const { reset, setCurrentAsset } = assetSlice.actions;
export default assetSlice.reducer; 