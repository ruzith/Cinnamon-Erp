import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import employeeService from './employeeService';

const initialState = {
  employees: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

export const getEmployees = createAsyncThunk('employees/getAll', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    return await employeeService.getEmployees(token);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data.message);
  }
});

export const createEmployee = createAsyncThunk(
  'employees/create',
  async (employeeData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await employeeService.createEmployee(employeeData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async ({ id, employeeData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await employeeService.updateEmployee(id, employeeData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'employees/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await employeeService.deleteEmployee(id, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEmployees.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.employees = action.payload;
      })
      .addCase(getEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.employees.push(action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.employees = state.employees.map(employee => 
          employee._id === action.payload._id ? action.payload : employee
        );
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.employees = state.employees.filter(
          employee => employee._id !== action.payload.id
        );
      });
  }
});

export const { reset } = employeeSlice.actions;
export default employeeSlice.reducer; 