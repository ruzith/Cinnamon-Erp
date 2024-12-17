import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as SalesIcon,
  Payments as PaymentIcon,
  People as CustomersIcon,
  TrendingUp as RevenueIcon,
} from '@mui/icons-material';
import axios from 'axios';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Sales = () => {
  const [tabValue, setTabValue] = useState(0);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [saleFormData, setSaleFormData] = useState({
    orderNumber: '',
    customerId: '',
    items: [],
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: '',
    notes: '',
    shippingAddress: '',
    totalAmount: 0
  });

  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    companyName: '',
    taxNumber: '',
    notes: ''
  });

  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchInventory();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await axios.get('/api/sales');
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (sale = null) => {
    if (sale) {
      setSelectedSale(sale);
      setSaleFormData({
        orderNumber: sale.orderNumber,
        customerId: sale.customerId._id,
        items: sale.items,
        status: sale.status,
        paymentStatus: sale.paymentStatus,
        paymentMethod: sale.paymentMethod,
        notes: sale.notes,
        shippingAddress: sale.shippingAddress,
        totalAmount: sale.totalAmount
      });
      setSelectedItems(sale.items);
    } else {
      setSelectedSale(null);
      setSaleFormData({
        orderNumber: '',
        customerId: '',
        items: [],
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: '',
        notes: '',
        shippingAddress: '',
        totalAmount: 0
      });
      setSelectedItems([]);
    }
    setOpenDialog(true);
  };

  const handleOpenCustomerDialog = (customer = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setCustomerFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        companyName: customer.companyName,
        taxNumber: customer.taxNumber,
        notes: customer.notes
      });
    } else {
      setSelectedCustomer(null);
      setCustomerFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        companyName: '',
        taxNumber: '',
        notes: ''
      });
    }
    setOpenCustomerDialog(true);
  };

  const handleOpenDetailsDialog = (sale) => {
    setSelectedSale(sale);
    setOpenDetailsDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSale(null);
  };

  const handleCloseCustomerDialog = () => {
    setOpenCustomerDialog(false);
    setSelectedCustomer(null);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedSale(null);
  };

  const handleSaleInputChange = (e) => {
    setSaleFormData({
      ...saleFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCustomerInputChange = (e) => {
    setCustomerFormData({
      ...customerFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleItemSelect = (event, value) => {
    setSelectedItems(value);
    const totalAmount = value.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    setSaleFormData(prev => ({
      ...prev,
      items: value,
      totalAmount
    }));
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSale) {
        await axios.put(`/api/sales/${selectedSale._id}`, saleFormData);
      } else {
        await axios.post('/api/sales', saleFormData);
      }
      fetchSales();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCustomer) {
        await axios.put(`/api/customers/${selectedCustomer._id}`, customerFormData);
      } else {
        await axios.post('/api/customers', customerFormData);
      }
      fetchCustomers();
      handleCloseCustomerDialog();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleDelete = async (saleId) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await axios.delete(`/api/sales/${saleId}`);
        fetchSales();
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'partially_paid':
        return 'warning';
      case 'pending':
        return 'error';
      default:
        return 'default';
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2),
    pendingOrders: sales.filter(sale => sale.status === 'pending').length,
    activeCustomers: new Set(sales.map(sale => sale.customerId?._id)).size
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Sales Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Sale
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
              <SalesIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="textSecondary">Total Sales</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.totalSales}</Typography>
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
              <RevenueIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography color="textSecondary">Total Revenue</Typography>
            </Box>
            <Typography variant="h4">${summaryStats.totalRevenue}</Typography>
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
              <PaymentIcon sx={{ color: 'warning.main', mr: 1 }} />
              <Typography color="textSecondary">Pending Orders</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.pendingOrders}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(156, 39, 176, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CustomersIcon sx={{ color: 'secondary.main', mr: 1 }} />
              <Typography color="textSecondary">Active Customers</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.activeCustomers}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Sales Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale._id} hover>
                  <TableCell>{sale.orderNumber}</TableCell>
                  <TableCell>{sale.customerId?.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={sale.status}
                      color={getStatusColor(sale.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={sale.paymentStatus}
                      color={getPaymentStatusColor(sale.paymentStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDetailsDialog(sale)}
                      sx={{ color: 'info.main' }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(sale)}
                      sx={{ color: 'primary.main', ml: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(sale._id)}
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

      {/* Keep your existing dialogs with current form fields */}
    </Box>
  );
};

export default Sales; 