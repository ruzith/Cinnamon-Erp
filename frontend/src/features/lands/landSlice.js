import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import landService from './landService';

const initialState = {
  lands: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get lands
export const getLands = createAsyncThunk('lands/getAll', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user?.token;

    if (!token) {
      throw new Error('No token found - user not authenticated');
    }

    return await landService.getLands(token);
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// Create land
export const createLand = createAsyncThunk('lands/create', async (landData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user?.token;

    if (!token) {
      throw new Error('No token found - user not authenticated');
    }

    return await landService.createLand(landData, token);
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// Update land
export const updateLand = createAsyncThunk('lands/update', async ({ id, landData }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    await landService.updateLand({ id, landData }, token);
    // Fetch fresh data after update
    return await landService.getLands(token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Delete land
export const deleteLand = createAsyncThunk('lands/delete', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    const result = await landService.deleteLand(id, token);
    return result;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const landSlice = createSlice({
  name: 'land',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLands.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getLands.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        console.log('Lands received:', action.payload);
        state.lands = action.payload;
      })
      .addCase(getLands.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createLand.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createLand.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.lands.push(action.payload);
        state.message = 'Land created successfully';
      })
      .addCase(createLand.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateLand.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateLand.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.lands = action.payload;
      })
      .addCase(updateLand.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteLand.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteLand.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.lands = state.lands.filter(land => land.id !== action.payload.id);
        state.message = 'Land deleted successfully';
      })
      .addCase(deleteLand.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset } = landSlice.actions;
export default landSlice.reducer;