import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import loanService from './loanService';

const initialState = {
  loans: [],
  currentLoan: null,
  payments: [],
  reports: {
    overdue: null
  },
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get loans
export const getLoans = createAsyncThunk(
  'loans/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await loanService.getLoans(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Create loan
export const createLoan = createAsyncThunk(
  'loans/create',
  async (loanData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await loanService.createLoan(loanData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Record payment
export const recordPayment = createAsyncThunk(
  'loans/recordPayment',
  async ({ loanId, paymentData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await loanService.recordPayment(loanId, paymentData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const loanSlice = createSlice({
  name: 'loan',
  initialState,
  reducers: {
    reset: (state) => initialState,
    setCurrentLoan: (state, action) => {
      state.currentLoan = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLoans.fulfilled, (state, action) => {
        state.loans = action.payload;
      })
      .addCase(createLoan.fulfilled, (state, action) => {
        state.loans.unshift(action.payload);
        state.currentLoan = action.payload;
      })
      .addCase(recordPayment.fulfilled, (state, action) => {
        state.payments.unshift(action.payload);
        // Update loan status if needed
        const loan = state.loans.find(l => l.id === action.payload.loan.id);
        if (loan) {
          loan.status = action.payload.loan.status;
          loan.remainingBalance = action.payload.loan.remainingBalance;
        }
      });
  }
});

export const { reset, setCurrentLoan } = loanSlice.actions;
export default loanSlice.reducer; 