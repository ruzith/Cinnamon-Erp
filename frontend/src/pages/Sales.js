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
  Print as PrintIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useCurrencyFormatter } from '../utils/currencyUtils';

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
    status: 'draft',
    paymentStatus: 'pending',
    paymentMethod: '',
    notes: '',
    shippingAddress: '',
    totalAmount: 0,
    tax: 0,
    discount: 0,
    subTotal: 0
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

  const { formatCurrency } = useCurrencyFormatter();

  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchInventory();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await axios.get('/api/sales');
      setSales(response.data);
      
      // Calculate stats from the sales data
      const stats = calculateStats(response.data);
      setStats({
        ...stats,
        // Keep other stats if any
      });
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
      const response = await axios.get('/api/inventory?type=finished_good');
      setInventory(response.data.map(item => ({
        ...item,
        productName: item.product_name,
        selling_price: parseFloat(item.selling_price) || 0
      })));
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
      const mappedItems = sale.items?.map(item => ({
        id: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price || item.price,
        unit: item.unit
      })) || [];

      setSaleFormData({
        orderNumber: sale.order_number || '',
        customerId: sale.customer_id || '',
        items: mappedItems,
        status: sale.status || 'draft',
        paymentStatus: sale.payment_status || 'pending',
        paymentMethod: sale.payment_method || '',
        notes: sale.notes || '',
        shippingAddress: sale.shipping_address || '',
        totalAmount: sale.total_amount || 0,
        tax: sale.tax || 0,
        discount: sale.discount || 0,
        subTotal: sale.sub_total || 0
      });
    } else {
      setSelectedSale(null);
      setSaleFormData({
        orderNumber: '',
        customerId: '',
        items: [],
        status: 'draft',
        paymentStatus: 'pending',
        paymentMethod: '',
        notes: '',
        shippingAddress: '',
        totalAmount: 0,
        tax: 0,
        discount: 0,
        subTotal: 0
      });
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
    
    // Map the selected items with their selling prices from inventory
    const items = value.map(item => ({
      id: item.id,
      product_id: item.id,
      product_name: item.product_name || item.productName,
      quantity: 1, // Default quantity
      unit_price: parseFloat(item.selling_price) || 0,
      unit: item.unit
    }));

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    setSaleFormData(prev => ({
      ...prev,
      items: items,
      totalAmount: totalAmount,
      subTotal: totalAmount
    }));
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form data
    if (!saleFormData.items.length) {
      alert('Please select at least one product');
      return;
    }

    // Validate each item
    for (const item of saleFormData.items) {
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        alert('Please enter a valid quantity for all products');
        return;
      }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        alert('Please enter a valid price for all products');
        return;
      }
    }

    try {
      const transformedItems = saleFormData.items.map(item => ({
        product_id: item.product_id || item.id,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount: parseFloat(item.discount) || 0,
        sub_total: parseFloat(item.quantity) * parseFloat(item.unit_price) - (parseFloat(item.discount) || 0)
      }));

      const formattedData = {
        customer_id: saleFormData.customerId,
        items: transformedItems,
        status: saleFormData.status,
        payment_status: saleFormData.paymentStatus,
        payment_method: saleFormData.paymentMethod,
        notes: saleFormData.notes,
        shipping_address: saleFormData.shippingAddress,
        tax: parseFloat(saleFormData.tax) || 0,
        discount: parseFloat(saleFormData.discount) || 0,
        sub_total: saleFormData.subTotal,
        total: saleFormData.totalAmount,
        date: new Date().toISOString().split('T')[0]
      };

      if (selectedSale) {
        await axios.put(`/api/sales/${selectedSale.id}`, formattedData);
      } else {
        await axios.post('/api/sales', formattedData);
      }
      fetchSales();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving sale:', error);
      alert(error.response?.data?.message || 'Error saving sale');
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
    totalRevenue: sales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0).toFixed(2),
    pendingOrders: sales.filter(sale => sale.payment_status === 'pending').length,
    activeCustomers: new Set(sales.map(sale => sale.customerId?.id)).size
  };

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setOpenDetailsDialog(true);
  };

  const handleEdit = (sale) => {
    handleOpenDialog(sale);
  };

  const handlePrintInvoice = async (sale) => {
    try {
      const response = await axios.get(`/api/sales/${sale.id}/print`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${sale.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error printing invoice:', error);
    }
  };

  const calculateStats = (sales) => {
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    const pendingOrders = sales.filter(sale => sale.payment_status === 'pending').length;

    return {
      totalRevenue: totalRevenue.toFixed(2),
      pendingOrders
    };
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
            <Typography variant="h4">{formatCurrency(summaryStats.totalRevenue)}</Typography>
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
                    {formatCurrency(sale.totalAmount)}
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
                    <IconButton
                      size="small"
                      onClick={() => handlePrintInvoice(sale)}
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>
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
              <FormControl fullWidth>
                <InputLabel>Select Products</InputLabel>
                <Select
                  multiple
                  name="items"
                  value={selectedItems}
                  label="Select Products"
                  onChange={(e) => {
                    const selectedProducts = e.target.value;
                    handleItemSelect(null, selectedProducts);
                  }}
                  required
                >
                  {inventory.map((item) => (
                    <MenuItem key={item.id} value={item}>
                      <Box>
                        <Typography variant="body1">{item.product_name || item.productName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Stock: {item.quantity} {item.unit}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              {selectedItems.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {saleFormData.items.map((item, index) => (
                        <TableRow key={item.product_id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...saleFormData.items];
                                newItems[index].quantity = parseFloat(e.target.value) || 0;
                                newItems[index].sub_total = 
                                  newItems[index].quantity * newItems[index].unit_price;
                                
                                const newTotal = newItems.reduce((sum, item) => 
                                  sum + (item.quantity * item.unit_price), 0);
                                
                                setSaleFormData(prev => ({
                                  ...prev,
                                  items: newItems,
                                  totalAmount: newTotal,
                                  subTotal: newTotal
                                }));
                              }}
                              InputProps={{ inputProps: { min: 0, step: "1" } }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.unit_price}
                              onChange={(e) => {
                                const newItems = [...saleFormData.items];
                                newItems[index].unit_price = parseFloat(e.target.value) || 0;
                                newItems[index].sub_total = 
                                  newItems[index].quantity * newItems[index].unit_price;
                                
                                const newTotal = newItems.reduce((sum, item) => 
                                  sum + (item.quantity * item.unit_price), 0);
                                
                                setSaleFormData(prev => ({
                                  ...prev,
                                  items: newItems,
                                  totalAmount: newTotal,
                                  subTotal: newTotal
                                }));
                              }}
                              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                            />
                          </TableCell>
                          <TableCell>
                            {(item.quantity * item.unit_price).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
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
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
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
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Sale Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Invoice To Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  pb: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  Invoice To:
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                    {selectedSale.customer_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSale.customer_address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSale.customer_phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSale.customer_email}
                  </Typography>
                </Box>
              </Grid>

              {/* Invoice Details Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  pb: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  Invoice Details:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Invoice Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedSale.invoice_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(selectedSale.date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Items
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedSale.total_items}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Sub Total
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(selectedSale.sub_total)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(selectedSale.total)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      size="small"
                      label={selectedSale.status}
                      color={getStatusColor(selectedSale.status)}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Payment Status
                    </Typography>
                    <Chip
                      size="small"
                      label={selectedSale.payment_status}
                      color={getPaymentStatusColor(selectedSale.payment_status)}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {selectedSale.notes}
                    </Typography>
                  </Grid>
                </Grid>
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