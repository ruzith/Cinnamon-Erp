import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    joiningDate: '',
    address: '',
    status: 'active'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        salary: employee.salary,
        joiningDate: employee.joiningDate?.split('T')[0] || '',
        address: employee.address,
        status: employee.status
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        salary: '',
        joiningDate: '',
        address: '',
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedEmployee) {
        await axios.put(`/api/employees/${selectedEmployee._id}`, formData);
      } else {
        await axios.post('/api/employees', formData);
      }
      fetchEmployees();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`/api/employees/${employeeId}`);
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <Typography variant="h6">Employee Management</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Add New Employee
          </Button>
        </div>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell>{`${employee.firstName} ${employee.lastName}`}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.status}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(employee)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteEmployee(employee._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  name="firstName"
                  label="First Name"
                  fullWidth
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="lastName"
                  label="Last Name"
                  fullWidth
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="email"
                  label="Email"
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="phone"
                  label="Phone"
                  fullWidth
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="position"
                  label="Position"
                  fullWidth
                  value={formData.position}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="department"
                  label="Department"
                  fullWidth
                  value={formData.department}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="salary"
                  label="Salary"
                  type="number"
                  fullWidth
                  value={formData.salary}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="joiningDate"
                  label="Joining Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.joiningDate}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="address"
                  label="Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="on_leave">On Leave</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} color="primary">
              {selectedEmployee ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default EmployeeManagement; 