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
  Factory as FactoryIcon,
  Inventory as ProductIcon,
  Engineering as WorkerIcon,
  Grade as QualityIcon,
} from '@mui/icons-material';
import axios from 'axios';

const STATUS_OPTIONS = ['planned', 'in_progress', 'completed', 'cancelled'];

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
    status: 'planned',
    rawMaterials: '',
    machineUsed: '',
    qualityGrade: '',
    notes: ''
  });
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    product_id: '',
    quantity: '',
    assigned_to: '',
    status: 'planned',
    priority: 'normal',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: ''
  });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchManufacturingOrders();
    fetchEmployees();
    fetchProducts();
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
      console.log('Employee data:', response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleOpenDialog = (order = null) => {
    if (order) {
      setSelectedOrder(order);
      setFormData({
        orderNumber: order.order_number,
        productType: order.product_name,
        quantity: order.quantity,
        assignedWorkers: order.assigned_to ? [order.assigned_to] : [],
        startDate: order.start_date?.split('T')[0] || '',
        endDate: order.end_date?.split('T')[0] || '',
        status: order.status,
        rawMaterials: order.raw_materials || '',
        machineUsed: order.machine_used || '',
        qualityGrade: order.quality_grade || '',
        notes: order.notes || ''
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
        status: 'planned',
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
        await axios.put(`/api/manufacturing-orders/${selectedOrder.id}`, formData);
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

  const calculateAverageQuality = (orders) => {
    const completedOrders = orders.filter(order => order.status === 'completed');
    if (!completedOrders.length) return 0;
    
    const qualityMap = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
    const sum = completedOrders.reduce((acc, order) => acc + (qualityMap[order.qualityGrade] || 0), 0);
    return (sum / completedOrders.length).toFixed(1);
  };

  const summaryStats = {
    totalOrders: manufacturingOrders.length,
    activeOrders: manufacturingOrders.filter(order => order.status === 'in_progress').length,
    completedOrders: manufacturingOrders.filter(order => order.status === 'completed').length,
    averageQuality: calculateAverageQuality(manufacturingOrders)
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

  const handleOpenOrderDialog = (order = null) => {
    if (order) {
      setSelectedOrder(order);
      setOrderFormData({
        product_id: order.product_id,
        quantity: order.quantity,
        assigned_to: order.assigned_to,
        status: order.status,
        priority: order.priority,
        start_date: order.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        end_date: order.end_date?.split('T')[0] || '',
        notes: order.notes
      });
    } else {
      setSelectedOrder(null);
      setOrderFormData({
        product_id: '',
        quantity: '',
        assigned_to: '',
        status: 'planned',
        priority: 'normal',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: ''
      });
    }
    setOpenOrderDialog(true);
  };

  const handleCloseOrderDialog = () => {
    setOpenOrderDialog(false);
    setSelectedOrder(null);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    if (!orderFormData.start_date) {
      alert('Please select a start date');
      return;
    }

    try {
      const { order_number, ...submitData } = orderFormData;
      
      if (selectedOrder) {
        await axios.put(`/api/manufacturing-orders/${selectedOrder.id}`, submitData);
      } else {
        await axios.post('/api/manufacturing-orders', submitData);
      }
      fetchManufacturingOrders();
      handleCloseOrderDialog();
    } catch (error) {
      console.error('Error saving manufacturing order:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Manufacturing Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenOrderDialog()}
        >
          New Manufacturing Order
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
              <FactoryIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="textSecondary">Total Orders</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.totalOrders}</Typography>
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
              <Typography color="textSecondary">Active Orders</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.activeOrders}</Typography>
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
              <ProductIcon sx={{ color: 'warning.main', mr: 1 }} />
              <Typography color="textSecondary">Completed Orders</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.completedOrders}</Typography>
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
              <QualityIcon sx={{ color: 'info.main', mr: 1 }} />
              <Typography color="textSecondary">Avg. Quality</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.averageQuality}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Orders Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Product Type</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Quality Grade</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manufacturingOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{order.product_name}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{new Date(order.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.priority}
                      color={order.priority === 'urgent' ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenOrderDialog(order)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(order.id)}
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

      {/* Add the Manufacturing Order Dialog */}
      <Dialog open={openOrderDialog} onClose={handleCloseOrderDialog}>
        <DialogTitle>
          {selectedOrder ? 'Edit Manufacturing Order' : 'New Manufacturing Order'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product"
                name="product_id"
                select
                value={orderFormData.product_id}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  product_id: e.target.value
                }))}
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={orderFormData.quantity}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  quantity: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assigned To"
                name="assigned_to"
                select
                value={orderFormData.assigned_to}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  assigned_to: e.target.value
                }))}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {[employee.first_name, employee.last_name].filter(Boolean).join(' ') || 'Unknown Employee'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                required
                fullWidth
                label="Start Date"
                name="start_date"
                type="date"
                value={orderFormData.start_date}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  start_date: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
                error={!orderFormData.start_date}
                helperText={!orderFormData.start_date ? 'Start date is required' : ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Date"
                name="end_date"
                type="date"
                value={orderFormData.end_date}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  end_date: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
                helperText="Optional"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={orderFormData.notes}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Status"
                name="status"
                select
                value={orderFormData.status}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  status: e.target.value
                }))}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleOrderSubmit}>
            {selectedOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Manufacturing; 