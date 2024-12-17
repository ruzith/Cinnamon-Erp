import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import manufacturingService from './manufacturingService';

const initialState = {
  contractors: [],
  assignments: [],
  payments: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get contractors
export const getContractors = createAsyncThunk(
  'manufacturing/getContractors',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await manufacturingService.getContractors(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Create contractor
export const createContractor = createAsyncThunk(
  'manufacturing/createContractor',
  async (contractorData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await manufacturingService.createContractor(contractorData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Create assignment
export const createAssignment = createAsyncThunk(
  'manufacturing/createAssignment',
  async (assignmentData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await manufacturingService.createAssignment(assignmentData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Create advance payment
export const createAdvancePayment = createAsyncThunk(
  'manufacturing/createAdvancePayment',
  async (paymentData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await manufacturingService.createAdvancePayment(paymentData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const manufacturingSlice = createSlice({
  name: 'manufacturing',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getContractors.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getContractors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.contractors = action.payload;
      })
      .addCase(createContractor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.contractors.push(action.payload);
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.assignments.push(action.payload);
      })
      .addCase(createAdvancePayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments.push(action.payload);
      });
  }
});

export const { reset } = manufacturingSlice.actions;
export default manufacturingSlice.reducer; 