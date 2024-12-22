import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  IconButton,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  WorkOutline as WorkIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import axios from 'axios';
import {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation
} from '../features/designations/designationSlice';
import { useCurrencyFormatter } from '../utils/currencyUtils';

const EmployeeManagement = () => {
  const dispatch = useDispatch();
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    phone: '',
    address: '',
    birthday: '',
    designation_id: '',
    employment_type: 'permanent',
    status: 'active',
    salary_structure_id: '',
    bank_name: '',
    account_number: '',
    account_name: ''
  });
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [designationDialog, setDesignationDialog] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [designationFormData, setDesignationFormData] = useState({
    title: '',
    description: '',
    department: ''
  });
  const [activeTab, setActiveTab] = useState(0);
  const { formatCurrency } = useCurrencyFormatter();
  const [reassignDialog, setReassignDialog] = useState(false);
  const [reassignmentData, setReassignmentData] = useState({
    oldDesignationId: null,
    newDesignationId: '',
    affectedEmployees: [],
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchSalaryStructures = async () => {
      try {
        const response = await axios.get('/api/payroll/structures');
        setSalaryStructures(response.data);
      } catch (error) {
        console.error('Error fetching salary structures:', error);
      }
    };
    
    fetchSalaryStructures();
  }, []);

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const response = await axios.get('/api/designations');
        setDesignations(response.data);
      } catch (error) {
        console.error('Error fetching designations:', error);
      }
    };
    
    fetchDesignations();
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
        name: employee.name,
        nic: employee.nic,
        phone: employee.phone,
        address: employee.address,
        birthday: employee.birthday?.split('T')[0] || '',
        designation_id: employee.designation_id,
        employment_type: employee.employment_type,
        status: employee.status,
        salary_structure_id: employee.salary_structure_id,
        bank_name: employee.bank_name || '',
        account_number: employee.account_number || '',
        account_name: employee.account_name || ''
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        name: '',
        nic: '',
        phone: '',
        address: '',
        birthday: '',
        designation_id: '',
        employment_type: 'permanent',
        status: 'active',
        salary_structure_id: '',
        bank_name: '',
        account_number: '',
        account_name: ''
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
      const submitData = {
        ...formData,
        salary_structure_id: formData.salary_structure_id || null
      };

      if (selectedEmployee) {
        await axios.put(`/api/employees/${selectedEmployee.id}`, submitData);
      } else {
        await axios.post('/api/employees', submitData);
      }
      await fetchEmployees();
      const designationsResponse = await axios.get('/api/designations');
      setDesignations(designationsResponse.data);
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`/api/employees/${employeeId}`);
        await fetchEmployees();
        const designationsResponse = await axios.get('/api/designations');
        setDesignations(designationsResponse.data);
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(emp => emp.status === 'active').length,
    departments: [...new Set(employees.map(emp => emp.department))].length,
    averageSalary: employees.length 
      ? employees.reduce((sum, emp) => sum + Number(emp.basic_salary || 0), 0) / employees.length 
      : 0
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleOpenDesignationDialog = (designation = null) => {
    if (designation) {
      setSelectedDesignation(designation);
      setDesignationFormData({
        title: designation.title,
        description: designation.description || '',
        department: designation.department
      });
    } else {
      setSelectedDesignation(null);
      setDesignationFormData({
        title: '',
        description: '',
        department: ''
      });
    }
    setDesignationDialog(true);
  };

  const handleCloseDesignationDialog = () => {
    setDesignationDialog(false);
    setSelectedDesignation(null);
  };

  const handleDesignationInputChange = (e) => {
    setDesignationFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDesignationSubmit = async () => {
    try {
      if (selectedDesignation) {
        await dispatch(updateDesignation({
          id: selectedDesignation.id,
          designationData: designationFormData
        }));
      } else {
        await dispatch(createDesignation(designationFormData));
      }
      // Fetch updated designations after successful submission
      const response = await axios.get('/api/designations');
      setDesignations(response.data);
      handleCloseDesignationDialog();
    } catch (error) {
      console.error('Error handling designation submission:', error);
    }
  };

  const handleDeleteDesignation = async (id) => {
    try {
      if (window.confirm('Are you sure you want to delete this designation?')) {
        await dispatch(deleteDesignation(id)).unwrap();
        // Refresh the designations list
        const response = await axios.get('/api/designations');
        setDesignations(response.data);
      }
    } catch (error) {
      // If there are assigned employees, show reassignment dialog
      if (error?.employees) {
        setReassignmentData({
          oldDesignationId: id,
          newDesignationId: '',
          affectedEmployees: error.employees,
        });
        setReassignDialog(true);
      } else {
        console.error('Error deleting designation:', error);
        alert(error?.message || 'Error deleting designation');
      }
    }
  };

  const handleReassignmentClose = () => {
    setReassignDialog(false);
    setReassignmentData({
      oldDesignationId: null,
      newDesignationId: '',
      affectedEmployees: [],
    });
  };

  const handleReassignmentSubmit = async () => {
    if (!reassignmentData.newDesignationId) {
      return;
    }

    try {
      await dispatch(deleteDesignation({
        id: reassignmentData.oldDesignationId,
        options: {
          forceDelete: true,
          newDesignationId: reassignmentData.newDesignationId,
        },
      }));

      // Refresh designations list
      const response = await axios.get('/api/designations');
      setDesignations(response.data);
      
      handleReassignmentClose();
    } catch (error) {
      console.error('Error in reassignment:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const ReassignmentDialog = () => (
    <Dialog
      open={reassignDialog}
      onClose={handleReassignmentClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Reassign Employees</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This designation has employees assigned to it. Please select a new designation for these employees before deleting.
          </Alert>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>New Designation</InputLabel>
            <Select
              value={reassignmentData.newDesignationId}
              onChange={(e) => setReassignmentData(prev => ({
                ...prev,
                newDesignationId: e.target.value
              }))}
              label="New Designation"
            >
              {designations
                .filter(d => d.id !== reassignmentData.oldDesignationId)
                .map((designation) => (
                  <MenuItem key={designation.id} value={designation.id}>
                    {designation.title}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Affected Employees ({reassignmentData.affectedEmployees.length}):
          </Typography>
          <List dense>
            {reassignmentData.affectedEmployees.map((employee) => (
              <ListItem key={employee.id}>
                <ListItemText primary={employee.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReassignmentClose}>Cancel</Button>
        <Button
          onClick={handleReassignmentSubmit}
          color="primary"
          disabled={!reassignmentData.newDesignationId}
        >
          Reassign and Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Employee Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDesignationDialog()}
          >
            New Designation
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Employee
          </Button>
        </Box>
      </Box>

      {/* Summary Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(25, 118, 210, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="textSecondary">Total Employees</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.totalEmployees}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(46, 125, 50, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WorkIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography color="textSecondary">Active Employees</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.activeEmployees}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(251, 140, 0, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BusinessIcon sx={{ color: 'warning.main', mr: 1 }} />
              <Typography color="textSecondary">Departments</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.departments}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(2, 136, 209, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ color: 'info.main', mr: 1 }} />
              <Typography color="textSecondary">Avg. Salary</Typography>
            </Box>
            <Typography variant="h4">
              {formatCurrency(summaryStats.averageSalary)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Content Card with Tabs */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab label="Employees" />
          <Tab label="Designations" />
        </Tabs>

        {/* Employees Tab Content */}
        {activeTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>NIC</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Birthday</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Employee Group</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.nic}</TableCell>
                    <TableCell>{employee.address}</TableCell>
                    <TableCell>
                      {employee.birthday ? new Date(employee.birthday).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{employee.designation_title || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.employment_type}
                        color={employee.employment_type === 'permanent' ? 'primary' : 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status}
                        color={getStatusColor(employee.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(employee)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteEmployee(employee.id)}
                        sx={{ color: 'error.main', ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Designations Tab Content */}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Employee Count</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {designations.map((designation) => (
                  <TableRow key={designation.id}>
                    <TableCell>{designation.title}</TableCell>
                    <TableCell>{designation.department}</TableCell>
                    <TableCell>{designation.description}</TableCell>
                    <TableCell>{designation.employee_count}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDesignationDialog(designation)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDesignation(designation.id)}
                        sx={{ color: 'error.main', ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Designation Dialog */}
      <Dialog
        open={designationDialog}
        onClose={handleCloseDesignationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedDesignation ? 'Edit Designation' : 'New Designation'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={designationFormData.title}
                onChange={handleDesignationInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department"
                name="department"
                value={designationFormData.department}
                onChange={handleDesignationInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={designationFormData.description}
                onChange={handleDesignationInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDesignationDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleDesignationSubmit}>
            {selectedDesignation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employee Dialog - Keep your existing dialog code */}
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
                name="name"
                label="Name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="nic"
                label="NIC"
                fullWidth
                value={formData.nic}
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
                name="address"
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={formData.address}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="birthday"
                label="Birthday"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.birthday}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Designation</InputLabel>
                <Select
                  name="designation_id"
                  value={formData.designation_id}
                  label="Designation"
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="">Select Designation</MenuItem>
                  {designations.map((designation) => (
                    <MenuItem key={designation.id} value={designation.id}>
                      {designation.title} - {designation.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  name="employment_type"
                  value={formData.employment_type}
                  label="Employment Type"
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="permanent">Permanent</MenuItem>
                  <MenuItem value="temporary">Temporary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="bank_name"
                label="Bank Name"
                fullWidth
                value={formData.bank_name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="account_number"
                label="Account Number"
                fullWidth
                value={formData.account_number}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="account_name"
                label="Account Name"
                fullWidth
                value={formData.account_name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Salary Structure</InputLabel>
                <Select
                  name="salary_structure_id"
                  value={formData.salary_structure_id}
                  label="Salary Structure"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">None</MenuItem>
                  {salaryStructures.map((structure) => (
                    <MenuItem key={structure.id} value={structure.id}>
                      {structure.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

      <ReassignmentDialog />
    </Box>
  );
};

export default EmployeeManagement; 