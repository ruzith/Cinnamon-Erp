import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const getEmployeeGroups = createAsyncThunk(
  'employeeGroups/getEmployeeGroups',
  async () => {
    const response = await axios.get('/api/employee-groups');
    const groupsWithMembers = await Promise.all(
      response.data.map(async (group) => {
        const memberResponse = await axios.get(`/api/employee-groups/${group.id}`);
        return {
          ...group,
          members: memberResponse.data.members || []
        };
      })
    );
    return groupsWithMembers;
  }
);

export const createEmployeeGroup = createAsyncThunk(
  'employeeGroups/createEmployeeGroup',
  async (groupData) => {
    const response = await axios.post('/api/employee-groups', groupData);
    return response.data;
  }
);

export const updateEmployeeGroup = createAsyncThunk(
  'employeeGroups/updateEmployeeGroup',
  async ({ id, groupData }) => {
    const response = await axios.put(`/api/employee-groups/${id}`, groupData);
    return response.data;
  }
);

export const deleteEmployeeGroup = createAsyncThunk(
  'employeeGroups/deleteEmployeeGroup',
  async (id) => {
    await axios.delete(`/api/employee-groups/${id}`);
    return id;
  }
);

export const addGroupMembers = createAsyncThunk(
  'employeeGroups/addGroupMembers',
  async ({ groupId, employeeIds }) => {
    const response = await axios.post(`/api/employee-groups/${groupId}/members`, {
      employeeIds
    });
    return { groupId, data: response.data };
  }
);

export const removeGroupMembers = createAsyncThunk(
  'employeeGroups/removeGroupMembers',
  async ({ groupId, employeeIds }) => {
    await axios.delete(`/api/employee-groups/${groupId}/members`, {
      data: { employeeIds }
    });
    return { groupId, employeeIds };
  }
);

const initialState = {
  employeeGroups: [],
  status: 'idle',
  error: null
};

const employeeGroupSlice = createSlice({
  name: 'employeeGroups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get employee groups
      .addCase(getEmployeeGroups.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getEmployeeGroups.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.employeeGroups = action.payload;
      })
      .addCase(getEmployeeGroups.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Create employee group
      .addCase(createEmployeeGroup.fulfilled, (state, action) => {
        state.employeeGroups.push(action.payload);
      })
      // Update employee group
      .addCase(updateEmployeeGroup.fulfilled, (state, action) => {
        const index = state.employeeGroups.findIndex(group => group.id === action.payload.id);
        if (index !== -1) {
          state.employeeGroups[index] = action.payload;
        }
      })
      // Delete employee group
      .addCase(deleteEmployeeGroup.fulfilled, (state, action) => {
        state.employeeGroups = state.employeeGroups.filter(group => group.id !== action.payload);
      })
      // Add group members
      .addCase(addGroupMembers.fulfilled, (state, action) => {
        const group = state.employeeGroups.find(g => g.id === action.payload.groupId);
        if (group) {
          group.members = action.payload.data.members;
        }
      })
      // Remove group members
      .addCase(removeGroupMembers.fulfilled, (state, action) => {
        const group = state.employeeGroups.find(g => g.id === action.payload.groupId);
        if (group) {
          group.members = group.members.filter(member =>
            !action.payload.employeeIds.includes(member.id)
          );
        }
      });
  }
});

export default employeeGroupSlice.reducer;