import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Schedule as InProgressIcon,
  Cancel as CancelIcon,
  PersonAdd as AssignIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Schedule,
} from '@mui/icons-material';
import axios from 'axios';
import SummaryCard from '../components/common/SummaryCard';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    category_id: '',
    estimated_hours: '',
    notes: ''
  });
  const [activeTab, setActiveTab] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [taskReportDialog, setTaskReportDialog] = useState(false);
  const [selectedTaskReport, setSelectedTaskReport] = useState(null);
  const [taskReport, setTaskReport] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/task-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setSelectedTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        assigned_to: task.assigned_to?.id || '',
        priority: task.priority,
        status: task.status,
        due_date: task.due_date?.split('T')[0] || '',
        category_id: task.category_id || '',
        estimated_hours: task.estimated_hours,
        notes: task.notes
      });
    } else {
      setSelectedTask(null);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        category_id: '',
        estimated_hours: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
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
      // Convert estimated_hours to number if it exists
      const processedFormData = {
        ...formData,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : null,
        // Ensure empty strings are sent as null
        category_id: formData.category_id || null,
        notes: formData.notes || null,
        assigned_to: formData.assigned_to || null
      };

      if (selectedTask) {
        await axios.put(`/api/tasks/${selectedTask.id}`, processedFormData);
      } else {
        await axios.post('/api/tasks', processedFormData);
      }
      fetchTasks();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleCancelTask = async (taskId) => {
    if (window.confirm('Are you sure you want to cancel this task?')) {
      try {
        await axios.put(`/api/tasks/${taskId}`, { status: 'cancelled' });
        fetchTasks();
      } catch (error) {
        console.error('Error cancelling task:', error);
      }
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.status === 'completed').length,
    pendingTasks: tasks.filter(task => task.status === 'pending').length,
    inProgressTasks: tasks.filter(task => task.status === 'in_progress').length
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'default';

    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (categoryName) => {
    if (!categoryName) return 'default';

    // Find the category object by name to get its ID
    const category = categories.find(c => c.name === categoryName);
    if (!category) return 'default';

    // List of available MUI colors
    const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];

    // Use the category ID to consistently assign a color
    return colors[category.id % colors.length];
  };

  const handleOpenCategoryDialog = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setCategoryFormData({
        name: category.name,
        description: category.description || ''
      });
    } else {
      setSelectedCategory(null);
      setCategoryFormData({
        name: '',
        description: ''
      });
    }
    setCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialog(false);
    setSelectedCategory(null);
  };

  const handleCategoryInputChange = (e) => {
    setCategoryFormData({
      ...categoryFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCategory) {
        await axios.put(`/api/task-categories/${selectedCategory.id}`, categoryFormData);
      } else {
        await axios.post('/api/task-categories', categoryFormData);
      }
      await fetchCategories();
      handleCloseCategoryDialog();
    } catch (error) {
      console.error('Error saving task category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`/api/task-categories/${categoryId}`);
        await fetchCategories();
      } catch (error) {
        if (error.response?.data?.hasTasks) {
          alert('Cannot delete category that has tasks assigned to it. Please reassign or delete the tasks first.');
        } else {
          console.error('Error deleting category:', error);
        }
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenAssignDialog = (task) => {
    setSelectedTask(task);
    setSelectedEmployee(task.assigned_to?.id || '');
    setAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialog(false);
    setSelectedTask(null);
    setSelectedEmployee('');
  };

  const handleAssignTask = async () => {
    try {
      await axios.put(`/api/tasks/${selectedTask.id}`, {
        assigned_to: selectedEmployee || null
      });
      fetchTasks();
      handleCloseAssignDialog();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const handleOpenTaskReport = async (task) => {
    setSelectedTaskReport(task);
    try {
      // Fetch task report data
      const response = await axios.get(`/api/tasks/${task.id}/report`);
      setTaskReport(response.data);
      setTaskReportDialog(true);
    } catch (error) {
      console.error('Error fetching task report:', error);
    }
  };

  const handleCloseTaskReport = () => {
    setTaskReportDialog(false);
    setSelectedTaskReport(null);
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
        Task Report - {selectedTaskReport?.title}
      </DialogTitle>
      <DialogContent>
        {taskReport && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Estimated Hours"
                  value={`${taskReport.estimated_hours || 0} hrs`}
                  icon={TimelineIcon}
                  iconColor="primary.main"
                  gradientColor="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Progress"
                  value={`${taskReport.progress || 0}%`}
                  icon={AssessmentIcon}
                  iconColor="info.main"
                  gradientColor="info"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Days Remaining"
                  value={taskReport.days_remaining}
                  icon={Schedule}
                  iconColor="warning.main"
                  gradientColor="warning"
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 2 }}>Task Details</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography>{selectedTaskReport?.description || 'No description'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography>{selectedTaskReport?.notes || 'No notes'}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 2 }}>History & Updates</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Updated By</TableCell>
                    <TableCell>Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taskReport.history?.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status}
                          color={getStatusColor(entry.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{entry.updated_by}</TableCell>
                      <TableCell>{entry.comments}</TableCell>
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

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Task Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCategoryDialog()}
          >
            New Category
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Task
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={TaskIcon}
            title="Total Tasks"
            value={summaryStats.totalTasks}
            iconColor="#1976d2"
            gradientColor="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={CompletedIcon}
            title="Completed"
            value={summaryStats.completedTasks}
            iconColor="#2e7d32"
            gradientColor="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={PendingIcon}
            title="Pending"
            value={summaryStats.pendingTasks}
            iconColor="#ed6c02"
            gradientColor="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={InProgressIcon}
            title="In Progress"
            value={summaryStats.inProgressTasks}
            iconColor="#0288d1"
            gradientColor="info"
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab label="Tasks" />
          <Tab label="Categories" />
        </Tabs>

        {/* Tasks Tab Content */}
        {activeTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {task.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {task.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {task.category_name && (
                        <Chip
                          label={task.category_name}
                          size="small"
                          color={getCategoryColor(task.category_name)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {task.assigned_to_name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.priority || 'Not Set'}
                        color={getPriorityColor(task.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.status}
                        color={getStatusColor(task.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenTaskReport(task)}
                        sx={{ color: 'info.main' }}
                        title="View Task Report"
                      >
                        <AssessmentIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenAssignDialog(task)}
                        sx={{ color: 'info.main', ml: 1 }}
                        title="Assign Task"
                      >
                        <AssignIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(task)}
                        sx={{ color: 'primary.main', ml: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      {task.status !== 'cancelled' && (
                        <IconButton
                          size="small"
                          onClick={() => handleCancelTask(task.id)}
                          sx={{ color: 'warning.main', ml: 1 }}
                        >
                          <CancelIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTask(task.id)}
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

        {/* Categories Tab Content */}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Task Count</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell>{category.task_count || 0}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenCategoryDialog(category)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCategory(category.id)}
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

      {/* Task Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Task Title"
                fullWidth
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  name="assigned_to"
                  value={formData.assigned_to}
                  label="Assigned To"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="due_date"
                label="Due Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.due_date}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  label="Priority"
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category_id"
                  value={formData.category_id}
                  label="Category"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">
                    <em>No Category</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="estimated_hours"
                label="Estimated Hours"
                type="number"
                fullWidth
                value={formData.estimated_hours}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            color="primary"
          >
            {selectedTask ? 'Update Task' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialog}
        onClose={handleCloseAssignDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Assign Task
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={selectedEmployee}
                label="Assign To"
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignTask}
            color="primary"
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={categoryDialog}
        onClose={handleCloseCategoryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCategory ? 'Edit Category' : 'New Category'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Category Name"
                fullWidth
                value={categoryFormData.name}
                onChange={handleCategoryInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={categoryFormData.description}
                onChange={handleCategoryInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCategorySubmit}
            color="primary"
          >
            {selectedCategory ? 'Update Category' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      <TaskReportDialog />
    </Box>
  );
};

export default TaskManagement;