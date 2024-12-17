import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import inventoryService from './inventoryService';

const initialState = {
  categories: [],
  products: [],
  transactions: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get categories
export const getCategories = createAsyncThunk(
  'inventory/getCategories',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await inventoryService.getCategories(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Get products
export const getProducts = createAsyncThunk(
  'inventory/getProducts',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await inventoryService.getProducts(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Create transaction
export const createTransaction = createAsyncThunk(
  'inventory/createTransaction',
  async (transactionData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await inventoryService.createTransaction(transactionData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.transactions.push(action.payload);
        // Update product stock in products array
        const product = state.products.find(p => p._id === action.payload.product._id);
        if (product) {
          product.currentStock = action.payload.newStock;
        }
      });
  }
});

export const { reset } = inventorySlice.actions;
export default inventorySlice.reducer; 