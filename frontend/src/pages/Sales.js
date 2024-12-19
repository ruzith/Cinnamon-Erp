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
        customerId: sale.customerId.id,
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
        await axios.put(`/api/sales/${selectedSale.id}`, saleFormData);
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
        await axios.put(`/api/customers/${selectedCustomer.id}`, customerFormData);
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
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'draft':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
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
    totalRevenue: sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0).toFixed(2),
    pendingOrders: sales.filter(sale => sale.status === 'pending').length,
    activeCustomers: new Set(sales.map(sale => sale.customerId?.id)).size
  };

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setOpenDetailsDialog(true);
  };

  const handleEdit = (sale) => {
    handleOpenDialog(sale);
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
                <TableCell>Date</TableCell>
                <TableCell>Invoice #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} hover>
                  <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.invoice_number}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{sale.customer_name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {sale.customer_phone}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{sale.total_items}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'LKR'
                    }).format(sale.total)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={sale.payment_status}
                      color={getPaymentStatusColor(sale.payment_status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={sale.status}
                      color={getStatusColor(sale.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(sale)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    {sale.status === 'draft' && (
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(sale)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add this dialog component before the final closing Box tag */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedSale ? 'Edit Sale' : 'New Sale'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customerId"
                  value={saleFormData.customerId}
                  label="Customer"
                  onChange={handleSaleInputChange}
                  required
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={inventory}
                getOptionLabel={(option) => option.productName}
                value={selectedItems}
                onChange={handleItemSelect}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Products"
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={saleFormData.status}
                  label="Status"
                  onChange={handleSaleInputChange}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  name="paymentStatus"
                  value={saleFormData.paymentStatus}
                  label="Payment Status"
                  onChange={handleSaleInputChange}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="paymentMethod"
                  value={saleFormData.paymentMethod}
                  label="Payment Method"
                  onChange={handleSaleInputChange}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Shipping Address"
                name="shippingAddress"
                multiline
                rows={2}
                value={saleFormData.shippingAddress}
                onChange={handleSaleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={2}
                value={saleFormData.notes}
                onChange={handleSaleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaleSubmit}>
            {selectedSale ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sale Details</DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Invoice Number</Typography>
                <Typography variant="body1">{selectedSale.invoice_number}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedSale.date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Customer</Typography>
                <Typography variant="body1">{selectedSale.customer_name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedSale.customer_phone}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedSale.customer_email}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Address</Typography>
                <Typography variant="body1">{selectedSale.customer_address}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">Total Items</Typography>
                <Typography variant="body1">{selectedSale.total_items}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">Sub Total</Typography>
                <Typography variant="body1">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'LKR'
                  }).format(selectedSale.sub_total)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">Total</Typography>
                <Typography variant="body1">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'LKR'
                  }).format(selectedSale.total)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                <Chip
                  size="small"
                  label={selectedSale.status}
                  color={getStatusColor(selectedSale.status)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Payment Status</Typography>
                <Chip
                  size="small"
                  label={selectedSale.payment_status}
                  color={getPaymentStatusColor(selectedSale.payment_status)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
                <Typography variant="body1">{selectedSale.notes}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sales; 