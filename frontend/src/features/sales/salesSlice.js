import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import salesService from './salesService';

const initialState = {
  invoices: [],
  currentInvoice: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get all invoices
export const getInvoices = createAsyncThunk(
  'sales/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await salesService.getInvoices(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Create invoice
export const createInvoice = createAsyncThunk(
  'sales/create',
  async (invoiceData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await salesService.createInvoice(invoiceData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Update invoice
export const updateInvoice = createAsyncThunk(
  'sales/update',
  async ({ id, invoiceData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await salesService.updateInvoice(id, invoiceData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    reset: (state) => initialState,
    setCurrentInvoice: (state, action) => {
      state.currentInvoice = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getInvoices.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.invoices = action.payload;
      })
      .addCase(getInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.invoices.unshift(action.payload);
        state.currentInvoice = action.payload;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.invoices = state.invoices.map(invoice => 
          invoice._id === action.payload._id ? action.payload : invoice
        );
        state.currentInvoice = action.payload;
      });
  }
});

export const { reset, setCurrentInvoice } = salesSlice.actions;
export default salesSlice.reducer; 