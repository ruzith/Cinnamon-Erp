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

const Manufacturing = () => {
  const [manufacturingOrders, setManufacturingOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    orderNumber: '',
    productType: '',
    quantity: '',
    assignedWorkers: [],
    startDate: '',
    endDate: '',
    status: 'pending',
    rawMaterials: '',
    machineUsed: '',
    qualityGrade: '',
    notes: ''
  });

  useEffect(() => {
    fetchManufacturingOrders();
    fetchEmployees();
  }, []);

  const fetchManufacturingOrders = async () => {
    try {
      const response = await axios.get('/api/manufacturing-orders');
      setManufacturingOrders(response.data);
    } catch (error) {
      console.error('Error fetching manufacturing orders:', error);
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

  const handleOpenDialog = (order = null) => {
    if (order) {
      setSelectedOrder(order);
      setFormData({
        orderNumber: order.orderNumber,
        productType: order.productType,
        quantity: order.quantity,
        assignedWorkers: order.assignedWorkers.map(worker => worker._id),
        startDate: order.startDate?.split('T')[0] || '',
        endDate: order.endDate?.split('T')[0] || '',
        status: order.status,
        rawMaterials: order.rawMaterials,
        machineUsed: order.machineUsed,
        qualityGrade: order.qualityGrade,
        notes: order.notes
      });
    } else {
      setSelectedOrder(null);
      setFormData({
        orderNumber: '',
        productType: '',
        quantity: '',
        assignedWorkers: [],
        startDate: '',
        endDate: '',
        status: 'pending',
        rawMaterials: '',
        machineUsed: '',
        qualityGrade: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
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
      if (selectedOrder) {
        await axios.put(`/api/manufacturing-orders/${selectedOrder._id}`, formData);
      } else {
        await axios.post('/api/manufacturing-orders', formData);
      }
      fetchManufacturingOrders();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving manufacturing order:', error);
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this manufacturing order?')) {
      try {
        await axios.delete(`/api/manufacturing-orders/${orderId}`);
        fetchManufacturingOrders();
      } catch (error) {
        console.error('Error deleting manufacturing order:', error);
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
          <Typography variant="h6">Manufacturing Orders</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            New Manufacturing Order
          </Button>
        </div>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Product Type</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Quality Grade</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manufacturingOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.productType}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>
                    <Chip 
                      label={order.status.replace('_', ' ')} 
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(order.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{order.endDate ? new Date(order.endDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{order.qualityGrade}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(order)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(order._id)}>
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
            {selectedOrder ? 'Edit Manufacturing Order' : 'New Manufacturing Order'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  name="orderNumber"
                  label="Order Number"
                  fullWidth
                  value={formData.orderNumber}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="productType"
                  label="Product Type"
                  fullWidth
                  value={formData.productType}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="quantity"
                  label="Quantity"
                  type="number"
                  fullWidth
                  value={formData.quantity}
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
                  name="rawMaterials"
                  label="Raw Materials"
                  fullWidth
                  value={formData.rawMaterials}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="machineUsed"
                  label="Machine Used"
                  fullWidth
                  value={formData.machineUsed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="qualityGrade"
                  label="Quality Grade"
                  fullWidth
                  value={formData.qualityGrade}
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
              {selectedOrder ? 'Update Order' : 'Create Order'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Manufacturing; 