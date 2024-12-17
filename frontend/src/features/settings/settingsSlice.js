import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import settingsService from './settingsService';

const initialState = {
  settings: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

export const getSettings = createAsyncThunk(
  'settings/get',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await settingsService.getSettings(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch settings');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'settings/update',
  async (data, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await settingsService.updateSettings(data, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update settings');
    }
  }
);

export const addCurrency = createAsyncThunk(
  'settings/addCurrency',
  async (data, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await settingsService.addCurrency(data, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add currency');
    }
  }
);

export const editCurrency = createAsyncThunk(
  'settings/editCurrency',
  async (data, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await settingsService.editCurrency(data, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to edit currency');
    }
  }
);

export const deleteCurrency = createAsyncThunk(
  'settings/deleteCurrency',
  async (code, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await settingsService.deleteCurrency(code, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete currency');
    }
  }
);

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.settings = action.payload;
      })
      .addCase(getSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Handle currency operations
      .addCase(addCurrency.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(editCurrency.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(deleteCurrency.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  }
});

export const { reset } = settingsSlice.actions;
export default settingsSlice.reducer; 