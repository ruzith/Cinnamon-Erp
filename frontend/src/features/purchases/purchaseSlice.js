import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import purchaseService from './purchaseService';

const initialState = {
  grades: [],
  invoices: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get grades
export const getGrades = createAsyncThunk(
  'purchases/getGrades',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await purchaseService.getGrades(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Create invoice
export const createInvoice = createAsyncThunk(
  'purchases/createInvoice',
  async (invoiceData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await purchaseService.createInvoice(invoiceData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Update invoice
export const updateInvoice = createAsyncThunk(
  'purchases/updateInvoice',
  async ({ id, invoiceData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await purchaseService.updateInvoice(id, invoiceData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const purchaseSlice = createSlice({
  name: 'purchase',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGrades.fulfilled, (state, action) => {
        state.grades = action.payload;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.invoices.push(action.payload);
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.invoices = state.invoices.map(invoice => 
          invoice._id === action.payload._id ? action.payload : invoice
        );
      });
  }
});

export const { reset } = purchaseSlice.actions;
export default purchaseSlice.reducer; 