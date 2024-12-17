import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from './userService';

const initialState = {
  users: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Get users
export const getUsers = createAsyncThunk('users/getAll', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user?.token;
    if (!token) {
      throw new Error('No token found - user not authenticated');
    }
    return await userService.getUsers(token);
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// Create user
export const createUser = createAsyncThunk('users/create', async (userData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user?.token;
    if (!token) {
      throw new Error('No token found - user not authenticated');
    }
    return await userService.createUser(userData, token);
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

// Update user
export const updateUser = createAsyncThunk('users/update', async ({ id, userData }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    return await userService.updateUser(id, userData, token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data.message);
  }
});

// Delete user
export const deleteUser = createAsyncThunk('users/delete', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    return await userService.deleteUser(id, token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data.message);
  }
});

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = action.payload;
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add other cases for create, update, and delete
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users.push(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = state.users.map(user => 
          user._id === action.payload._id ? action.payload : user
        );
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = state.users.filter(user => user._id !== action.payload.id);
      });
  }
});

export const { reset } = userSlice.actions;
export default userSlice.reducer; 