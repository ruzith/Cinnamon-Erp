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
  ShoppingCart,
  AttachMoney,
  People,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useCurrencyFormatter } from '../utils/currencyUtils';
import SummaryCard from '../components/common/SummaryCard';
import { useDispatch, useSelector } from 'react-redux';
import { getCustomers, createCustomer, updateCustomer } from '../features/customers/customerSlice';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Sales = () => {
  const dispatch = useDispatch();
  const { customers = [], isLoading, isError, message } = useSelector((state) => state.customers || { customers: [] });
  const { user } = useSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

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
    address: ''
  });

  const [selectedItems, setSelectedItems] = useState([]);

  const { formatCurrency } = useCurrencyFormatter();

  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingOrders: 0
  });

  // Add new state for product rows
  const [productRows, setProductRows] = useState([{
    product_id: '',
    quantity: 1,
    unit_price: 0,
    sub_total: 0
  }]);

  useEffect(() => {
    fetchSales();
    dispatch(getCustomers());
    fetchInventory();
  }, [dispatch]);

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
        address: customer.address
      });
    } else {
      setSelectedCustomer(null);
      setCustomerFormData({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
    }
    setOpenCustomerDialog(true);
  };

  const handleViewDetails = async (sale) => {
    setSelectedSale(sale);
    setOpenDetailsDialog(true);
    setIsLoadingItems(true);

    try {
      const response = await axios.get(`/api/sales/${sale.id}/items`);
      setSaleItems(response.data);
    } catch (error) {
      console.error('Error fetching sale items:', error);
    } finally {
      setIsLoadingItems(false);
    }
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
      total: totalAmount,
      sub_total: totalAmount
    }));
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();

    // Validate the form data
    if (!productRows.length || !productRows[0].product_id) {
      alert('Please select at least one product');
      return;
    }

    // Validate each product row
    for (const row of productRows) {
      if (!row.quantity || parseFloat(row.quantity) <= 0) {
        alert('Please enter a valid quantity for all products');
        return;
      }
      if (!row.unit_price || parseFloat(row.unit_price) <= 0) {
        alert('Please enter a valid price for all products');
        return;
      }
    }

    try {
      const transformedItems = productRows.map(row => {
        return {
          product_id: row.product_id,
          quantity: parseFloat(row.quantity),
          unit_price: parseFloat(row.unit_price),
          sub_total: row.sub_total,
          discount: 0
        };
      });

      const totalAmount = transformedItems.reduce((sum, item) => sum + item.sub_total, 0);

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
        sub_total: totalAmount,
        total: totalAmount - (parseFloat(saleFormData.discount) || 0) + (parseFloat(saleFormData.tax) || 0),
        date: new Date().toISOString().split('T')[0]
      };

      if (selectedSale) {
        await axios.put(`/api/sales/${selectedSale.id}`, formattedData);
      } else {
        await axios.post('/api/sales', formattedData);
      }
      fetchSales();
      handleCloseDialog();

      // Reset product rows
      setProductRows([{
        product_id: '',
        quantity: 1,
        unit_price: 0,
        sub_total: 0
      }]);
    } catch (error) {
      console.error('Error saving sale:', error);
      alert(error.response?.data?.message || 'Error saving sale');
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user) {
        alert('You must be logged in to create a customer');
        return;
      }

      const formattedCustomerData = {
        name: customerFormData.name,
        email: customerFormData.email || null,
        phone: customerFormData.phone,
        address: customerFormData.address,
        credit_limit: 0,
        current_balance: 0,
        status: 'active',
        created_by: user._id
      };

      if (selectedCustomer) {
        await dispatch(updateCustomer({ id: selectedCustomer.id, customerData: formattedCustomerData })).unwrap();
      } else {
        await dispatch(createCustomer(formattedCustomerData)).unwrap();
      }
      handleCloseCustomerDialog();

      // Reset form data after successful submission
      setCustomerFormData({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
    } catch (error) {
      console.error('Error saving customer:', error);
      alert(error.message || 'Error saving customer');
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

  const handleEdit = (sale) => {
    handleOpenDialog(sale);
  };

  const handlePrintInvoice = async (sale) => {
    try {
      const response = await axios.get(`/api/sales/${sale.id}/print`);

      // Create a new window and write the invoice HTML
      const printWindow = window.open('', '_blank');
      printWindow.document.write(response.data.invoiceHtml);
      printWindow.document.close();

      // Print automatically when content is loaded
      printWindow.onload = function() {
        printWindow.print();
      };
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert(error.response?.data?.message || 'Error printing invoice');
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

  // Add function to handle adding new product row
  const handleAddProductRow = () => {
    setProductRows([...productRows, {
      product_id: '',
      quantity: 1,
      unit_price: 0,
      sub_total: 0
    }]);
  };

  // Add function to handle product row changes
  const handleProductRowChange = (index, field, value) => {
    const newRows = [...productRows];
    newRows[index][field] = value;

    // Calculate sub_total for this row
    if (field === 'quantity' || field === 'unit_price') {
      newRows[index].sub_total = newRows[index].quantity * newRows[index].unit_price;
    }

    setProductRows(newRows);

    // Update total amount
    const newTotal = newRows.reduce((sum, row) => sum + (row.sub_total || 0), 0);
    setSaleFormData(prev => ({
      ...prev,
      totalAmount: newTotal,
      subTotal: newTotal
    }));
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Sales Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCustomerDialog()}
            sx={{ mr: 2 }}
          >
            New Customer
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Sale
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={ShoppingCart}
            title="Total Sales"
            value={sales.length}
            iconColor="#9C27B0"
            gradientColor="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AttachMoney}
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            iconColor="#2E7D32"
            gradientColor="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={People}
            title="Total Customers"
            value={isLoading ? '...' : customers.length}
            iconColor="#D32F2F"
            gradientColor="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={PendingIcon}
            title="Pending Orders"
            value={stats.pendingOrders}
            iconColor="#0288D1"
            gradientColor="info"
          />
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
                    {formatCurrency(sale.total)}
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
                      sx={{ color: 'info.main' }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handlePrintInvoice(sale)}
                      sx={{ color: 'success.main', ml: 1 }}
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>
                    {sale.status === 'draft' && (
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(sale)}
                        sx={{ color: 'primary.main', ml: 1 }}
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <MenuItem value="">Loading customers...</MenuItem>
                  ) : customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {isError && (
                <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                  Error loading customers: {message}
                </Typography>
              )}
            </Grid>

            {/* Replace product selection with product rows */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Products</Typography>
              {productRows.map((row, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControl sx={{ flex: 2 }}>
                    <InputLabel>Product</InputLabel>
                    <Select
                      value={row.product_id}
                      label="Product"
                      onChange={(e) => {
                        const product = inventory.find(p => p.id === e.target.value);
                        handleProductRowChange(index, 'product_id', e.target.value);
                        handleProductRowChange(index, 'unit_price', product?.selling_price || 0);
                      }}
                      required
                    >
                      {inventory.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.product_name || item.productName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    type="number"
                    label="Quantity"
                    value={row.quantity}
                    onChange={(e) => handleProductRowChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    sx={{ flex: 1 }}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                  <TextField
                    type="number"
                    label="Unit Price"
                    value={row.unit_price}
                    onChange={(e) => handleProductRowChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    sx={{ flex: 1 }}
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                  />
                  <TextField
                    type="number"
                    label="Subtotal"
                    value={row.sub_total}
                    disabled
                    sx={{ flex: 1 }}
                  />
                </Box>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddProductRow}
                sx={{ mt: 1 }}
              >
                Add Product
              </Button>
            </Grid>

            {/* Add accounting connection for payments */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Payment Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
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
              </Grid>
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

      {/* Add Customer Dialog */}
      <Dialog
        open={openCustomerDialog}
        onClose={handleCloseCustomerDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={customerFormData.name}
                onChange={handleCustomerInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={customerFormData.email}
                onChange={handleCustomerInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={customerFormData.phone}
                onChange={handleCustomerInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={2}
                value={customerFormData.address}
                onChange={handleCustomerInputChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCustomerDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCustomerSubmit}>
            {selectedCustomer ? 'Update' : 'Add'} Customer
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>Sale Details</Typography>
            <Box>
              {/* Removed print button */}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                {/* Invoice To Section */}
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: 'primary.main'
                  }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                      {selectedSale.customer_name}
                    </Typography>
                    {selectedSale.customer_address && (
                      <Box sx={{ display: 'flex', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          Address:
                        </Typography>
                        <Typography variant="body2">
                          {selectedSale.customer_address}
                        </Typography>
                      </Box>
                    )}
                    {selectedSale.customer_phone && (
                      <Box sx={{ display: 'flex', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          Phone:
                        </Typography>
                        <Typography variant="body2">
                          {selectedSale.customer_phone}
                        </Typography>
                      </Box>
                    )}
                    {selectedSale.customer_email && (
                      <Box sx={{ display: 'flex', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                          Email:
                        </Typography>
                        <Typography variant="body2">
                          {selectedSale.customer_email}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Typography variant="h6" sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: 'primary.main'
                  }}>
                    Shipping Information
                  </Typography>
                  <Box>
                    {selectedSale.shipping_address ? (
                      <Typography variant="body2">
                        {selectedSale.shipping_address}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Same as customer address
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: 'primary.main'
                  }}>
                    Invoice Details
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Invoice Number
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedSale.invoice_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Date
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {new Date(selectedSale.date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        size="small"
                        label={selectedSale.status}
                        color={getStatusColor(selectedSale.status)}
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Payment Status
                      </Typography>
                      <Chip
                        size="small"
                        label={selectedSale.payment_status}
                        color={getPaymentStatusColor(selectedSale.payment_status)}
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Payment Method
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                        {selectedSale.payment_method?.replace(/_/g, ' ')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedSale.created_by_name}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Items Table */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <TableContainer>
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
                        {isLoadingItems ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                Loading items...
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : saleItems.length > 0 ? (
                          saleItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2">{item.product_name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.unit}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                              <TableCell align="right">{formatCurrency(item.sub_total)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                No items found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Summary Section */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  {/* Notes Section */}
                  <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <Typography variant="h6" sx={{
                        fontWeight: 600,
                        mb: 2,
                        color: 'primary.main'
                      }}>
                        Notes
                      </Typography>
                      <Typography variant="body2">
                        {selectedSale.notes || 'No notes available'}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Payment Summary */}
                  <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <Typography variant="h6" sx={{
                        fontWeight: 600,
                        mb: 2,
                        color: 'primary.main'
                      }}>
                        Payment Summary
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                        <Typography variant="body1">{formatCurrency(selectedSale.sub_total)}</Typography>
                      </Box>
                      {Number(selectedSale.discount) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Discount:</Typography>
                          <Typography variant="body1" color="error.main">
                            -{formatCurrency(selectedSale.discount)}
                          </Typography>
                        </Box>
                      )}
                      {Number(selectedSale.tax) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Tax:</Typography>
                          <Typography variant="body1">{formatCurrency(selectedSale.tax)}</Typography>
                        </Box>
                      )}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 2,
                        pt: 2,
                        borderTop: '2px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total:</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {formatCurrency(selectedSale.total)}
                        </Typography>
                      </Box>
                    </Paper>
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