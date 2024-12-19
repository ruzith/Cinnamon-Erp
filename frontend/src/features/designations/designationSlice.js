import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import designationService from './designationService';

const initialState = {
  designations: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get designations
export const getDesignations = createAsyncThunk('designations/getAll', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    return await designationService.getDesignations(token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data.message);
  }
});

// Create designation
export const createDesignation = createAsyncThunk(
  'designations/create',
  async (designationData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await designationService.createDesignation(designationData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Update designation
export const updateDesignation = createAsyncThunk(
  'designations/update',
  async ({ id, designationData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await designationService.updateDesignation(id, designationData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

// Delete designation
export const deleteDesignation = createAsyncThunk(
  'designations/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await designationService.deleteDesignation(id, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const designationSlice = createSlice({
  name: 'designation',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDesignations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDesignations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.designations = action.payload;
      })
      .addCase(getDesignations.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createDesignation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.designations.push(action.payload);
      })
      .addCase(updateDesignation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.designations = state.designations.map(designation => 
          designation.id === action.payload.id ? action.payload : designation
        );
      })
      .addCase(deleteDesignation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.designations = state.designations.filter(
          designation => designation.id !== action.payload.id
        );
      });
  }
});

export const { reset } = designationSlice.actions;
export default designationSlice.reducer; 