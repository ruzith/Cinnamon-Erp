import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Switch,
  Stack,
  ListItemIcon,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  WorkOutline as WorkIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  AttachMoney as SalaryIcon,
  Group as GroupIcon,
  PersonOff as PersonOffIcon,
  Pending as PendingIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import axios from 'axios';
import {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation
} from '../features/designations/designationSlice';
import { updateEmployee, getEmployees } from '../features/employees/employeeSlice';
import { useCurrencyFormatter } from '../utils/currencyUtils';
import SummaryCard from '../components/common/SummaryCard';
import EmployeeForm from '../components/employees/EmployeeForm';
import employeeService from '../features/employees/employeeService';

const SALARY_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

const EmployeeManagement = () => {
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.employees);
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
    basic_salary: '',
    salary_type: SALARY_TYPES.MONTHLY,
    bank_name: '',
    account_number: '',
    account_name: ''
  });
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
  const [employeeGroups, setEmployeeGroups] = useState([]);
  const [groupDialog, setGroupDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: ''
  });
  const [groupMembersDialog, setGroupMembersDialog] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [taskReportDialog, setTaskReportDialog] = useState(false);
  const [selectedEmployeeReport, setSelectedEmployeeReport] = useState(null);
  const [taskReport, setTaskReport] = useState(null);

  useEffect(() => {
    dispatch(getEmployees());
    dispatch(getDesignations());
    fetchEmployeeGroups();
  }, [dispatch]);

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

  const fetchEmployeeGroups = async () => {
    try {
      const response = await axios.get('/api/employee-groups?include=members');
      setEmployeeGroups(response.data);
    } catch (error) {
      console.error('Error fetching employee groups:', error);
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
        basic_salary: employee.basic_salary,
        salary_type: employee.salary_type,
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
        basic_salary: '',
        salary_type: SALARY_TYPES.MONTHLY,
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
      if (selectedEmployee) {
        await axios.put(`/api/employees/${selectedEmployee.id}`, formData);
      } else {
        await axios.post('/api/employees', formData);
      }
      await dispatch(getEmployees());
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
        await dispatch(getEmployees());
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
    activeEmployees: employees.length,
    totalMonthlyCost: employees
      .reduce((total, emp) => {
        const salary = Number(emp.basic_salary) || 0;
        switch(emp.salary_type) {
          case 'daily':
            return total + (salary * 22); // Assuming 22 working days
          case 'weekly':
            return total + (salary * 4); // 4 weeks per month
          case 'monthly':
          default:
            return total + salary;
        }
      }, 0),
    departmentsCount: [...new Set(designations.map(d => d.department))].length,
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
      // Check if the error contains employees data
      if (error.employees) {
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
      // Single API call to reassign employees and delete designation
      await axios.post(`/api/designations/${reassignmentData.oldDesignationId}/reassign`, {
        newDesignationId: reassignmentData.newDesignationId
      });

      // Refresh the lists
      await dispatch(getEmployees()).unwrap();
      const response = await axios.get('/api/designations');
      setDesignations(response.data);

      handleReassignmentClose();
    } catch (error) {
      console.error('Error in reassignment:', error);
      alert(error?.response?.data?.message || 'Error during reassignment process');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenGroupDialog = (group = null) => {
    if (group) {
      setSelectedGroup(group);
      setGroupFormData({
        name: group.name,
        description: group.description || ''
      });
    } else {
      setSelectedGroup(null);
      setGroupFormData({
        name: '',
        description: ''
      });
    }
    setGroupDialog(true);
  };

  const handleCloseGroupDialog = () => {
    setGroupDialog(false);
    setSelectedGroup(null);
  };

  const handleGroupInputChange = (e) => {
    setGroupFormData({
      ...groupFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedGroup) {
        await axios.put(`/api/employee-groups/${selectedGroup.id}`, groupFormData);
      } else {
        await axios.post('/api/employee-groups', groupFormData);
      }
      await fetchEmployeeGroups();
      handleCloseGroupDialog();
    } catch (error) {
      console.error('Error saving employee group:', error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await axios.delete(`/api/employee-groups/${groupId}`);
        await fetchEmployeeGroups();
      } catch (error) {
        console.error('Error deleting employee group:', error);
      }
    }
  };

  const handleOpenGroupMembersDialog = async (group) => {
    try {
      const response = await axios.get(`/api/employee-groups/${group.id}`);
      setSelectedGroup(response.data);
      setSelectedEmployees(response.data.members.map(member => member.id));
      setGroupMembersDialog(true);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleCloseGroupMembersDialog = () => {
    setGroupMembersDialog(false);
    setSelectedGroup(null);
    setSelectedEmployees([]);
  };

  const handleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleUpdateGroupMembers = async () => {
    try {
      // Get current members of the group
      const currentMembers = selectedGroup.members.map(member => member.id);

      // Find members to add and remove
      const membersToAdd = selectedEmployees.filter(id => !currentMembers.includes(id));
      const membersToRemove = currentMembers.filter(id => !selectedEmployees.includes(id));

      // Add new members if any
      if (membersToAdd.length > 0) {
        await axios.post(`/api/employee-groups/${selectedGroup.id}/members`, {
          employeeIds: membersToAdd
        });
      }

      // Remove unselected members if any
      if (membersToRemove.length > 0) {
        await axios.delete(`/api/employee-groups/${selectedGroup.id}/members`, {
          data: { employeeIds: membersToRemove }
        });
      }

      await fetchEmployeeGroups();
      handleCloseGroupMembersDialog();
    } catch (error) {
      console.error('Error updating group members:', error);
    }
  };

  const getEmployeeGroups = (employeeId) => {
    const groups = employeeGroups.filter(group =>
      group.members?.some(member => member.id === employeeId)
    );
    return groups;
  };

  const getGroupColor = (groupName) => {
    if (!groupName) return 'default';

    // Find the group object by name
    const group = employeeGroups.find(g => g.name === groupName);
    if (!group) return 'default';

    // List of available MUI colors
    const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];

    // Use the group ID to consistently assign a color
    return colors[group.id % colors.length];
  };

  const handleOpenTaskReport = async (employee) => {
    setSelectedEmployeeReport(employee);
    try {
      const report = await employeeService.getEmployeeTaskReport(employee.id);
      setTaskReport(report);
      setTaskReportDialog(true);
    } catch (error) {
      console.error('Error fetching task report:', error);
    }
  };

  const handleCloseTaskReport = () => {
    setTaskReportDialog(false);
    setSelectedEmployeeReport(null);
    setTaskReport(null);
  };

  const TaskReportDialog = () => (
    <Dialog
      open={taskReportDialog}
      onClose={handleCloseTaskReport}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Task Report - {selectedEmployeeReport?.name}
      </DialogTitle>
      <DialogContent>
        {taskReport && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="Total Tasks"
                  value={taskReport.summary.totalTasks}
                  icon={AssessmentIcon}
                  iconColor="info.main"
                  gradientColor="info"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="Total Hours"
                  value={`${taskReport.summary.totalHours} hrs`}
                  icon={TimelineIcon}
                  iconColor="primary.main"
                  gradientColor="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="Completed Hours"
                  value={`${taskReport.summary.completedHours} hrs`}
                  icon={TimelineIcon}
                  iconColor="success.main"
                  gradientColor="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="Remaining Hours"
                  value={`${taskReport.summary.remainingHours} hrs`}
                  icon={PendingIcon}
                  iconColor="warning.main"
                  gradientColor="warning"
                />
              </Grid>
            </Grid>

            {/* Task Status Summary */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Task Status</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Completed" color="success" size="small" />
                    <Typography>{taskReport.summary.completedTasks} tasks</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="In Progress" color="warning" size="small" />
                    <Typography>{taskReport.summary.inProgressTasks} tasks</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Pending" color="default" size="small" />
                    <Typography>{taskReport.summary.pendingTasks} tasks</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Task List */}
            <Typography variant="h6" sx={{ mb: 2 }}>Assigned Tasks</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taskReport.tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{task.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.status.replace('_', ' ')}
                          color={
                            task.status === 'completed'
                              ? 'success'
                              : task.status === 'in_progress'
                              ? 'warning'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{Number(task.estimated_hours).toFixed(1)} hrs</TableCell>
                      <TableCell>
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseTaskReport}>Close</Button>
      </DialogActions>
    </Dialog>
  );

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

  const handleFormSubmitSuccess = async () => {
    try {
      // Refetch designations
      const designationsResponse = await axios.get('/api/designations');
      setDesignations(designationsResponse.data);

      // Refetch employee groups
      await fetchEmployeeGroups();
    } catch (error) {
      console.error('Error refetching data:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Employee Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenGroupDialog()}
          >
            New Group
          </Button>
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={GroupIcon}
            title="Total Employees"
            value={summaryStats.totalEmployees}
            iconColor="#1976D2"
            gradientColor="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={PersonIcon}
            title="Active Employees"
            value={summaryStats.activeEmployees}
            iconColor="#2E7D32"
            gradientColor="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={SalaryIcon}
            title="Monthly Salary Cost"
            value={formatCurrency(summaryStats.totalMonthlyCost)}
            iconColor="#9C27B0"
            gradientColor="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={BusinessIcon}
            title="Departments"
            value={summaryStats.departmentsCount}
            iconColor="#0288D1"
            gradientColor="info"
          />
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
          <Tab label="Groups" />
          <Tab label="Task Reports" />
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
                      {getEmployeeGroups(employee.id).length > 0 ? (
                        getEmployeeGroups(employee.id).map((group, index) => (
                          <React.Fragment key={group.id}>
                            {index > 0 && ' '}
                            <Chip
                              label={group.name}
                              color={getGroupColor(group.name)}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </React.Fragment>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No Group
                        </Typography>
                      )}
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

        {/* Groups Tab Content */}
        {activeTab === 2 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Members</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeGroups.map((group) => (
                  <TableRow key={group.id} hover>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${group.member_count} members`}
                        onClick={() => handleOpenGroupMembersDialog(group)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenGroupDialog(group)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteGroup(group.id)}
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

        {/* Task Reports Tab Content */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {employees.map((employee) => (
                <Grid item xs={12} md={6} lg={4} key={employee.id}>
                  <Paper
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => handleOpenTaskReport(employee)}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {employee.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {employee.designation_title || 'No Designation'}
                      </Typography>
                    </Box>

                    {taskReport && taskReport.employee_id === employee.id ? (
                      <>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Total Tasks
                            </Typography>
                            <Typography variant="h6">
                              {taskReport.summary.totalTasks}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Completed Tasks
                            </Typography>
                            <Typography variant="h6">
                              {taskReport.summary.completedTasks}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Total Hours
                          </Typography>
                          <Typography variant="body2">
                            {taskReport.summary.totalHours} hrs
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ flexGrow: 1 }} />
                    )}

                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AssessmentIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTaskReport(employee);
                        }}
                      >
                        View Report
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
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
          {selectedDesignation ? 'Edit Designation' : 'Create Designation'}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <EmployeeForm
            employee={selectedEmployee}
            setIsEditing={setSelectedEmployee}
            onClose={handleCloseDialog}
            onSubmitSuccess={handleFormSubmitSuccess}
          />
        </DialogContent>
      </Dialog>

      <ReassignmentDialog />

      {/* Group Dialog */}
      <Dialog
        open={groupDialog}
        onClose={handleCloseGroupDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedGroup ? 'Edit Group' : 'Create Group'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Group Name"
              name="name"
              value={groupFormData.name}
              onChange={handleGroupInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Description"
              name="description"
              multiline
              rows={3}
              value={groupFormData.description}
              onChange={handleGroupInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupDialog}>Cancel</Button>
          <Button onClick={handleGroupSubmit} variant="contained">
            {selectedGroup ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Members Dialog */}
      <Dialog
        open={groupMembersDialog}
        onClose={handleCloseGroupMembersDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Manage {selectedGroup?.name} Members
        </DialogTitle>
        <DialogContent>
          <List>
            {employees.map((employee) => (
              <ListItem key={employee.id}>
                <ListItemIcon>
                  <Checkbox
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={() => handleEmployeeSelection(employee.id)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={employee.name}
                  secondary={employee.designation_title}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupMembersDialog}>Cancel</Button>
          <Button onClick={handleUpdateGroupMembers} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Report Dialog */}
      <TaskReportDialog />
    </Box>
  );
};

export default EmployeeManagement;