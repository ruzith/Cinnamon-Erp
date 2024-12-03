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
  Tabs,
  Tab,
  Box,
  Autocomplete,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
    switch (status) {
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Sales Orders" />
          <Tab label="Customers" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Typography variant="h6">Sales Orders</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog()}
            >
              New Sale
            </Button>
          </div>

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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale._id}>
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
                    <TableCell>${sale.totalAmount}</TableCell>
                    <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDetailsDialog(sale)}>
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenDialog(sale)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(sale._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Typography variant="h6">Customers</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenCustomerDialog()}
            >
              Add Customer
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer._id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.companyName}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenCustomerDialog(customer)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Sale Dialog */}
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
              <Grid item xs={6}>
                <TextField
                  name="orderNumber"
                  label="Order Number"
                  fullWidth
                  value={saleFormData.orderNumber}
                  onChange={handleSaleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    name="customerId"
                    value={saleFormData.customerId}
                    label="Customer"
                    onChange={handleSaleInputChange}
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer._id} value={customer._id}>
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
                      placeholder="Products"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={saleFormData.status}
                    label="Status"
                    onChange={handleSaleInputChange}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
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
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={saleFormData.paymentMethod}
                    label="Payment Method"
                    onChange={handleSaleInputChange}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="totalAmount"
                  label="Total Amount"
                  type="number"
                  fullWidth
                  value={saleFormData.totalAmount}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="shippingAddress"
                  label="Shipping Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={saleFormData.shippingAddress}
                  onChange={handleSaleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  fullWidth
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
            <Button onClick={handleSaleSubmit} color="primary">
              {selectedSale ? 'Update Sale' : 'Create Sale'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Customer Dialog */}
        <Dialog 
          open={openCustomerDialog} 
          onClose={handleCloseCustomerDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedCustomer ? 'Edit Customer' : 'New Customer'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  name="name"
                  label="Customer Name"
                  fullWidth
                  value={customerFormData.name}
                  onChange={handleCustomerInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  value={customerFormData.email}
                  onChange={handleCustomerInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="phone"
                  label="Phone"
                  fullWidth
                  value={customerFormData.phone}
                  onChange={handleCustomerInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="companyName"
                  label="Company Name"
                  fullWidth
                  value={customerFormData.companyName}
                  onChange={handleCustomerInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="address"
                  label="Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={customerFormData.address}
                  onChange={handleCustomerInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="taxNumber"
                  label="Tax Number"
                  fullWidth
                  value={customerFormData.taxNumber}
                  onChange={handleCustomerInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={customerFormData.notes}
                  onChange={handleCustomerInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCustomerDialog}>Cancel</Button>
            <Button onClick={handleCustomerSubmit} color="primary">
              {selectedCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sale Details Dialog */}
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
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Order Number</Typography>
                  <Typography variant="body1">{selectedSale.orderNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Customer</Typography>
                  <Typography variant="body1">{selectedSale.customerId?.name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Items</Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSale.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">${item.unitPrice}</TableCell>
                            <TableCell align="right">
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <strong>Total Amount:</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>${selectedSale.totalAmount}</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Payment Method</Typography>
                  <Typography variant="body1">{selectedSale.paymentMethod}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Payment Status</Typography>
                  <Chip 
                    label={selectedSale.paymentStatus}
                    color={getPaymentStatusColor(selectedSale.paymentStatus)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Shipping Address</Typography>
                  <Typography variant="body1">{selectedSale.shippingAddress}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography variant="body1">{selectedSale.notes}</Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailsDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Sales; 