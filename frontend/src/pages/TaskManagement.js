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
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    category: '',
    estimatedHours: '',
    notes: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

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
        assignedTo: task.assignedTo?._id || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate?.split('T')[0] || '',
        category: task.category,
        estimatedHours: task.estimatedHours,
        notes: task.notes
      });
    } else {
      setSelectedTask(null);
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        status: 'pending',
        dueDate: '',
        category: '',
        estimatedHours: '',
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
      if (selectedTask) {
        await axios.put(`/api/tasks/${selectedTask._id}`, formData);
      } else {
        await axios.post('/api/tasks', formData);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
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

  const getStatusColor = (status) => {
    switch (status) {
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <Typography variant="h6">Task Management</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Create New Task
          </Button>
        </div>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task._id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>
                    {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={task.priority} 
                      color={getPriorityColor(task.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={task.status.replace('_', ' ')} 
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{task.category}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(task)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteTask(task._id)}>
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
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    name="assignedTo"
                    value={formData.assignedTo}
                    label="Assigned To"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {employees.map((employee) => (
                      <MenuItem key={employee._id} value={employee._id}>
                        {`${employee.firstName} ${employee.lastName}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    label="Priority"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="dueDate"
                  label="Due Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.dueDate}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="category"
                  label="Category"
                  fullWidth
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="estimatedHours"
                  label="Estimated Hours"
                  type="number"
                  fullWidth
                  value={formData.estimatedHours}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Additional Notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} color="primary">
              {selectedTask ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default TaskManagement; 