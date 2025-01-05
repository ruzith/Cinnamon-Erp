import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const getEmployees = createAsyncThunk(
  'employees/getEmployees',
  async () => {
    const response = await axios.get('/api/employees');
    return response.data;
  }
);

export const createEmployee = createAsyncThunk(
  'employees/createEmployee',
  async (employeeData) => {
    const response = await axios.post('/api/employees', employeeData);
    return response.data;
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/updateEmployee',
  async ({ id, employeeData }) => {
    const response = await axios.put(`/api/employees/${id}`, employeeData);
    return response.data;
  }
);

export const deleteEmployee = createAsyncThunk(
  'employees/deleteEmployee',
  async (id) => {
    await axios.delete(`/api/employees/${id}`);
    return id;
  }
);

const initialState = {
  employees: [],
  status: 'idle',
  error: null
};

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get employees
      .addCase(getEmployees.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.employees = action.payload;
      })
      .addCase(getEmployees.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Create employee
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.employees.push(action.payload);
      })
      // Update employee
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const index = state.employees.findIndex(employee => employee.id === action.payload.id);
        if (index !== -1) {
          state.employees[index] = action.payload;
        }
      })
      // Delete employee
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter(employee => employee.id !== action.payload);
      });
  }
});

export default employeeSlice.reducer;