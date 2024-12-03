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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Forest as ForestIcon,
  LocalFlorist as TreeIcon,
  Engineering as WorkerIcon,
  Speed as VolumeIcon,
} from '@mui/icons-material';
import axios from 'axios';

const CuttingManagement = () => {
  const [cuttingOperations, setCuttingOperations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [formData, setFormData] = useState({
    operationNumber: '',
    landParcel: '',
    assignedWorkers: [],
    startDate: '',
    endDate: '',
    status: 'pending',
    treeCount: '',
    species: '',
    estimatedVolume: '',
    actualVolume: '',
    equipment: '',
    notes: ''
  });

  useEffect(() => {
    fetchCuttingOperations();
    fetchEmployees();
  }, []);

  const fetchCuttingOperations = async () => {
    try {
      const response = await axios.get('/api/cutting/contractors');
      setCuttingOperations(response.data);
    } catch (error) {
      console.error('Error fetching cutting operations:', error);
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

  const handleOpenDialog = (operation = null) => {
    if (operation) {
      setSelectedOperation(operation);
      setFormData({
        operationNumber: operation.operationNumber,
        landParcel: operation.landParcel,
        assignedWorkers: operation.assignedWorkers.map(worker => worker._id),
        startDate: operation.startDate?.split('T')[0] || '',
        endDate: operation.endDate?.split('T')[0] || '',
        status: operation.status,
        treeCount: operation.treeCount,
        species: operation.species,
        estimatedVolume: operation.estimatedVolume,
        actualVolume: operation.actualVolume,
        equipment: operation.equipment,
        notes: operation.notes
      });
    } else {
      setSelectedOperation(null);
      setFormData({
        operationNumber: '',
        landParcel: '',
        assignedWorkers: [],
        startDate: '',
        endDate: '',
        status: 'pending',
        treeCount: '',
        species: '',
        estimatedVolume: '',
        actualVolume: '',
        equipment: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOperation(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'assignedWorkers' ? 
        typeof value === 'string' ? value.split(',') : value :
        value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedOperation) {
        await axios.put(`/api/cutting/contractors/${selectedOperation._id}`, formData);
      } else {
        await axios.post('/api/cutting/contractors', formData);
      }
      fetchCuttingOperations();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving cutting operation:', error);
    }
  };

  const handleDelete = async (operationId) => {
    if (window.confirm('Are you sure you want to delete this cutting operation?')) {
      try {
        await axios.delete(`/api/cutting/contractors/${operationId}`);
        fetchCuttingOperations();
      } catch (error) {
        console.error('Error deleting cutting operation:', error);
      }
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalOperations: cuttingOperations.length,
    activeOperations: cuttingOperations.filter(op => op.status === 'in_progress').length,
    totalTrees: cuttingOperations.reduce((sum, op) => sum + Number(op.treeCount || 0), 0),
    totalVolume: cuttingOperations.reduce((sum, op) => sum + Number(op.estimatedVolume || 0), 0)
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

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Cutting Operations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Cutting Operation
        </Button>
      </Box>

      {/* Summary Cards */}
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
              <ForestIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="textSecondary">Total Operations</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.totalOperations}</Typography>
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
              <WorkerIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography color="textSecondary">Active Operations</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.activeOperations}</Typography>
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
              <TreeIcon sx={{ color: 'warning.main', mr: 1 }} />
              <Typography color="textSecondary">Total Trees</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.totalTrees}</Typography>
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
              <VolumeIcon sx={{ color: 'info.main', mr: 1 }} />
              <Typography color="textSecondary">Total Volume</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.totalVolume} m³</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Operations Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Operation #</TableCell>
                <TableCell>Land Parcel</TableCell>
                <TableCell>Species</TableCell>
                <TableCell>Trees</TableCell>
                <TableCell>Volume (m³)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cuttingOperations.map((operation) => (
                <TableRow key={operation._id} hover>
                  <TableCell>{operation.operationNumber}</TableCell>
                  <TableCell>{operation.landParcel}</TableCell>
                  <TableCell>{operation.species}</TableCell>
                  <TableCell>{operation.treeCount}</TableCell>
                  <TableCell>{operation.estimatedVolume}</TableCell>
                  <TableCell>
                    <Chip
                      label={operation.status}
                      color={getStatusColor(operation.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(operation)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(operation._id)}
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
      </Paper>

      {/* Keep your existing dialog with the current form fields */}
    </Box>
  );
};

export default CuttingManagement; 