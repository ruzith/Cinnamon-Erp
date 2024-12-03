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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
          <Typography variant="h6">Cutting Operations Management</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            New Cutting Operation
          </Button>
        </div>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Operation #</TableCell>
                <TableCell>Land Parcel</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Species</TableCell>
                <TableCell>Volume (m³)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cuttingOperations.map((operation) => (
                <TableRow key={operation._id}>
                  <TableCell>{operation.operationNumber}</TableCell>
                  <TableCell>{operation.landParcel}</TableCell>
                  <TableCell>
                    <Chip 
                      label={operation.status.replace('_', ' ')} 
                      color={getStatusColor(operation.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(operation.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{operation.endDate ? new Date(operation.endDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{operation.species}</TableCell>
                  <TableCell>{operation.actualVolume || operation.estimatedVolume}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(operation)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(operation._id)}>
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
            {selectedOperation ? 'Edit Cutting Operation' : 'New Cutting Operation'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  name="operationNumber"
                  label="Operation Number"
                  fullWidth
                  value={formData.operationNumber}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="landParcel"
                  label="Land Parcel"
                  fullWidth
                  value={formData.landParcel}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Workers</InputLabel>
                  <Select
                    multiple
                    name="assignedWorkers"
                    value={formData.assignedWorkers}
                    label="Assigned Workers"
                    onChange={handleInputChange}
                    renderValue={(selected) => (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {selected.map((value) => {
                          const worker = employees.find(emp => emp._id === value);
                          return worker ? (
                            <Chip 
                              key={value} 
                              label={`${worker.firstName} ${worker.lastName}`} 
                              size="small"
                            />
                          ) : null;
                        })}
                      </div>
                    )}
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee._id} value={employee._id}>
                        {`${employee.firstName} ${employee.lastName}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="startDate"
                  label="Start Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="endDate"
                  label="End Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
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
                  name="treeCount"
                  label="Number of Trees"
                  type="number"
                  fullWidth
                  value={formData.treeCount}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="species"
                  label="Tree Species"
                  fullWidth
                  value={formData.species}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="estimatedVolume"
                  label="Estimated Volume (m³)"
                  type="number"
                  fullWidth
                  value={formData.estimatedVolume}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="actualVolume"
                  label="Actual Volume (m³)"
                  type="number"
                  fullWidth
                  value={formData.actualVolume}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="equipment"
                  label="Equipment Used"
                  fullWidth
                  value={formData.equipment}
                  onChange={handleInputChange}
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
            <Button onClick={handleSubmit} color="primary">
              {selectedOperation ? 'Update Operation' : 'Create Operation'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default CuttingManagement; 