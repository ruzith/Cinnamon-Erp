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

// Get contractor invoices
export const getContractorInvoices = createAsyncThunk(
  'purchases/getContractorInvoices',
  async (contractorId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await purchaseService.getContractorInvoices(contractorId, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Get contractor advance payments
export const getContractorAdvancePayments = createAsyncThunk(
  'purchases/getContractorAdvancePayments',
  async (contractorId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await purchaseService.getContractorAdvancePayments(contractorId, token);
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
      .addCase(getGrades.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGrades.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.grades = action.payload;
      })
      .addCase(getGrades.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.invoices.push(action.payload);
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.invoices = state.invoices.map(invoice =>
          invoice.id === action.payload.id ? action.payload : invoice
        );
      })
      .addCase(getContractorInvoices.fulfilled, (state, action) => {
        state.invoices = action.payload;
      })
      .addCase(getContractorAdvancePayments.fulfilled, (state, action) => {
        state.advancePayments = action.payload;
      });
  }
});

export const { reset } = purchaseSlice.actions;
export default purchaseSlice.reducer;