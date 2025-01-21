import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import accountingService from './accountingService';

const initialState = {
  accounts: [],
  transactions: [],
  reports: {
    trialBalance: null,
    profitLoss: null,
    balanceSheet: null
  },
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get accounts
export const getAccounts = createAsyncThunk(
  'accounting/getAccounts',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await accountingService.getAccounts(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Create transaction
export const createTransaction = createAsyncThunk(
  'accounting/createTransaction',
  async (transactionData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await accountingService.createTransaction(transactionData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Get reports
export const getReport = createAsyncThunk(
  'accounting/getReport',
  async ({ type, params }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await accountingService.getReport(type, params, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Add this new thunk
export const postTransaction = createAsyncThunk(
  'accounting/postTransaction',
  async (transactionId, thunkAPI) => {
    try {
      const response = await accountingService.postTransaction(transactionId);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const accountingSlice = createSlice({
  name: 'accounting',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAccounts.fulfilled, (state, action) => {
        state.accounts = action.payload;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      })
      .addCase(getReport.fulfilled, (state, action) => {
        state.reports[action.meta.arg.type] = action.payload;
      })
      .addCase(postTransaction.fulfilled, (state, action) => {
        const index = state.transactions.findIndex(t => t.id === action.meta.arg);
        if (index !== -1) {
          state.transactions[index].status = 'posted';
        }
      });
  }
});

export const { reset } = accountingSlice.actions;
export default accountingSlice.reducer;