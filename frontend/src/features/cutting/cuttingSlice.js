import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cuttingService from './cuttingService';

const initialState = {
  contractors: [],
  assignments: [],
  tasks: [],
  payments: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Async thunks for contractors, assignments, tasks, and payments
export const getContractors = createAsyncThunk(
  'cutting/getContractors',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await cuttingService.getContractors(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Add other async thunks for CRUD operations...

export const cuttingSlice = createSlice({
  name: 'cutting',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      // Add cases for all async operations
      .addCase(getContractors.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getContractors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.contractors = action.payload;
      })
      // Add other cases...
  }
});

export const { reset } = cuttingSlice.actions;
export default cuttingSlice.reducer; 