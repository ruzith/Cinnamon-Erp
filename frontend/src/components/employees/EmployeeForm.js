import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createEmployee, updateEmployee, getEmployees } from '../../features/employees/employeeSlice';
import { getDesignations } from '../../features/designations/designationSlice';
import { getEmployeeGroups } from '../../features/employeeGroups/employeeGroupSlice';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  OutlinedInput,
  Chip
} from '@mui/material';

const SALARY_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

const EmployeeForm = ({ employee, setIsEditing, onClose }) => {
  const dispatch = useDispatch();
  const { designations } = useSelector((state) => state.designations);
  const { employeeGroups } = useSelector((state) => state.employeeGroups);

  const [formData, setFormData] = useState({
    name: employee ? employee.name : '',
    nic: employee ? employee.nic : '',
    phone: employee ? employee.phone : '',
    address: employee ? employee.address : '',
    birthday: employee ? new Date(employee.birthday).toISOString().split('T')[0] : '',
    designation_id: employee ? employee.designation_id : '',
    employment_type: employee ? employee.employment_type : 'permanent',
    status: employee ? employee.status : 'active',
    basic_salary: employee ? employee.basic_salary : '',
    salary_type: employee ? employee.salary_type : SALARY_TYPES.MONTHLY,
    bank_name: employee ? employee.bank_name : '',
    account_number: employee ? employee.account_number : '',
    account_name: employee ? employee.account_name : '',
    group_ids: employee && employee.group_ids
      ? (Array.isArray(employee.group_ids)
          ? employee.group_ids
          : employee.group_ids.split(',').filter(id => id).map(id => parseInt(id)))
      : []
  });

  useEffect(() => {
    dispatch(getDesignations());
    dispatch(getEmployeeGroups());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleGroupChange = (event) => {
    const { value } = event.target;
    const groupIds = Array.isArray(value) ? value : [value];
    setFormData(prevState => ({
      ...prevState,
      group_ids: groupIds.map(id => parseInt(id))
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      if (employee) {
        await dispatch(updateEmployee({ id: employee.id, employeeData: formData })).unwrap();
        await dispatch(getEmployees()).unwrap();
        onClose && onClose();
      } else {
        await dispatch(createEmployee(formData)).unwrap();
        await dispatch(getEmployees()).unwrap();
        onClose && onClose();
      }
      // Refresh employee groups using the proper thunk
      await dispatch(getEmployeeGroups()).unwrap();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="NIC"
            name="nic"
            value={formData.nic}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Birthday"
            name="birthday"
            type="date"
            value={formData.birthday}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Address"
            name="address"
            multiline
            rows={2}
            value={formData.address}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Designation</InputLabel>
            <Select
              name="designation_id"
              value={formData.designation_id}
              onChange={handleInputChange}
              label="Designation"
            >
              {designations.map((designation) => (
                <MenuItem key={designation.id} value={designation.id}>
                  {designation.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Employment Type</InputLabel>
            <Select
              name="employment_type"
              value={formData.employment_type}
              onChange={handleInputChange}
              label="Employment Type"
            >
              <MenuItem value="permanent">Permanent</MenuItem>
              <MenuItem value="temporary">Temporary</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Basic Salary"
            name="basic_salary"
            type="number"
            inputProps={{ min: 0 }}
            value={formData.basic_salary}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Salary Type</InputLabel>
            <Select
              name="salary_type"
              value={formData.salary_type}
              onChange={handleInputChange}
              label="Salary Type"
            >
              <MenuItem value={SALARY_TYPES.DAILY}>Daily</MenuItem>
              <MenuItem value={SALARY_TYPES.WEEKLY}>Weekly</MenuItem>
              <MenuItem value={SALARY_TYPES.MONTHLY}>Monthly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Employee Groups</InputLabel>
            <Select
              multiple
              name="group_ids"
              value={formData.group_ids}
              onChange={handleGroupChange}
              input={<OutlinedInput label="Employee Groups" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const group = employeeGroups.find(g => g.id === value);
                    return group ? (
                      <Chip key={value} label={group.name} />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {employeeGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="normal"
            fullWidth
            label="Bank Name"
            name="bank_name"
            value={formData.bank_name}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            margin="normal"
            fullWidth
            label="Account Number"
            name="account_number"
            value={formData.account_number}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            margin="normal"
            fullWidth
            label="Account Name"
            name="account_name"
            value={formData.account_name}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {employee ? 'Update' : 'Save'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeForm;