import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const getDesignations = createAsyncThunk(
  'designations/getDesignations',
  async () => {
    const response = await axios.get('/api/designations');
    return response.data;
  }
);

export const createDesignation = createAsyncThunk(
  'designations/createDesignation',
  async (designationData) => {
    const response = await axios.post('/api/designations', designationData);
    return response.data;
  }
);

export const updateDesignation = createAsyncThunk(
  'designations/updateDesignation',
  async ({ id, designationData }) => {
    const response = await axios.put(`/api/designations/${id}`, designationData);
    return response.data;
  }
);

export const deleteDesignation = createAsyncThunk(
  'designations/deleteDesignation',
  async (id) => {
    await axios.delete(`/api/designations/${id}`);
    return id;
  }
);

const initialState = {
  designations: [],
  status: 'idle',
  error: null
};

const designationSlice = createSlice({
  name: 'designations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get designations
      .addCase(getDesignations.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getDesignations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.designations = action.payload;
      })
      .addCase(getDesignations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Create designation
      .addCase(createDesignation.fulfilled, (state, action) => {
        state.designations.push(action.payload);
      })
      // Update designation
      .addCase(updateDesignation.fulfilled, (state, action) => {
        const index = state.designations.findIndex(designation => designation.id === action.payload.id);
        if (index !== -1) {
          state.designations[index] = action.payload;
        }
      })
      // Delete designation
      .addCase(deleteDesignation.fulfilled, (state, action) => {
        state.designations = state.designations.filter(designation => designation.id !== action.payload);
      });
  }
});

export default designationSlice.reducer;