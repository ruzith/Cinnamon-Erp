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
          onClick={() => handleOpenDialog()}
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
                <TableRow key={order._id} hover>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.productType}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{new Date(order.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.qualityGrade || 'N/A'}
                      color={order.qualityGrade === 'A' ? 'success' : 'default'}
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
                      onClick={() => handleOpenDialog(order)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(order._id)}
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

export default Manufacturing; 