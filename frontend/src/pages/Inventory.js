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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Warning as AlertIcon,
  Factory as ManufacturingIcon,
  AttachMoney as ValueIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useCurrencyFormatter } from '../utils/currencyUtils';
import SummaryCard from '../components/common/SummaryCard';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Inventory = () => {
  const [tabValue, setTabValue] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    category: '',
    product_type: 'raw_material',
    quantity: '',
    unit: '',
    min_stock_level: '',
    max_stock_level: '',
    location: '',
    purchase_price: '',
    selling_price: '',
    description: '',
    status: 'active'
  });

  const [transactionData, setTransactionData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'revenue',
    amount: '',
    category: 'production',
    description: '',
    well_id: '',
    lease_id: '',
    status: 'draft',
    entries: []
  });

  const { formatCurrency } = useCurrencyFormatter();

  useEffect(() => {
    fetchInventory();
    fetchTransactions();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/inventory/transactions');
      console.log('Fetched transactions:', response.data);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        product_name: item.product_name,
        category: item.category,
        product_type: item.product_type,
        quantity: item.quantity,
        unit: item.unit,
        min_stock_level: item.min_stock_level,
        max_stock_level: item.max_stock_level,
        location: item.location,
        purchase_price: item.purchase_price,
        selling_price: item.selling_price,
        description: item.description,
        status: item.status
      });
    } else {
      setSelectedItem(null);
      setFormData({
        product_name: '',
        category: '',
        product_type: 'raw_material',
        quantity: '',
        unit: '',
        min_stock_level: '',
        max_stock_level: '',
        location: '',
        purchase_price: '',
        selling_price: '',
        description: '',
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleOpenTransactionDialog = (transaction = null) => {
    console.log('Opening transaction dialog with:', transaction);
    if (transaction && transaction.id) {
      // Map backend type to frontend type
      const typeMap = {
        'IN': 'revenue',
        'OUT': 'expense',
        'ADJUSTMENT': 'adjustment'
      };

      setSelectedItem(transaction);
      setTransactionData({
        date: transaction.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        type: typeMap[transaction.type] || 'revenue', // Map the type
        amount: transaction.quantity || '',
        category: transaction.category || 'production',
        description: transaction.notes || '',
        well_id: transaction.well_id || '',
        lease_id: transaction.lease_id || '',
        status: transaction.status || 'draft',
        entries: transaction.entries || []
      });
    } else {
      setSelectedItem(null);
      setTransactionData({
        date: new Date().toISOString().split('T')[0],
        type: 'revenue',
        amount: '',
        category: 'production',
        description: '',
        well_id: '',
        lease_id: '',
        status: 'draft',
        entries: []
      });
    }
    setOpenTransactionDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const handleCloseTransactionDialog = () => {
    setOpenTransactionDialog(false);
    setSelectedItem(null);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTransactionInputChange = (e) => {
    setTransactionData({
      ...transactionData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        product_name: formData.product_name,
        category: formData.category,
        product_type: formData.product_type,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        min_stock_level: Number(formData.min_stock_level),
        max_stock_level: Number(formData.max_stock_level),
        location: formData.location,
        purchase_price: Number(formData.purchase_price),
        selling_price: Number(formData.selling_price),
        description: formData.description,
        status: formData.status
      };

      if (selectedItem) {
        await axios.put(`/api/inventory/${selectedItem.id}`, payload);
      } else {
        await axios.post('/api/inventory', payload);
      }
      fetchInventory();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving inventory item:', error);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map frontend transaction type to backend type
      const typeMap = {
        'revenue': 'IN',
        'expense': 'OUT'
      };

      const payload = {
        ...transactionData,
        type: typeMap[transactionData.type], // Map the type
        entries: [
          {
            account_id: '1000',
            description: transactionData.description,
            debit: transactionData.type === 'revenue' ? transactionData.amount : 0,
            credit: transactionData.type === 'revenue' ? 0 : transactionData.amount
          },
          {
            account_id: transactionData.type === 'revenue' ? '4000' : '5000',
            description: transactionData.description,
            debit: transactionData.type === 'revenue' ? 0 : transactionData.amount,
            credit: transactionData.type === 'revenue' ? transactionData.amount : 0
          }
        ]
      };

      if (selectedItem) {
        await axios.put(`/api/inventory/transactions/${selectedItem.id}`, payload);
      } else {
        await axios.post('/api/inventory/transactions', payload);
      }
      fetchInventory();
      fetchTransactions();
      handleCloseTransactionDialog();
    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  };

  const handleDeactivate = async (itemId, showConfirmation = true) => {
    if (!showConfirmation || window.confirm('Are you sure you want to deactivate this inventory item?')) {
      try {
        await axios.put(`/api/inventory/${itemId}`, { status: 'inactive' });
        fetchInventory();
      } catch (error) {
        console.error('Error deactivating inventory item:', error);
      }
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await axios.delete(`/api/inventory/${itemId}`);
        fetchInventory();
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        if (error.response?.status === 400 &&
            error.response?.data?.message?.includes('Cannot delete item with existing transactions')) {
          if (window.confirm(error.response.data.message)) {
            await handleDeactivate(itemId, false);
          }
        }
      }
    }
  };

  const getStockLevelLabel = (item) => {
    if (!item) return 'Unknown';
    if (item.quantity <= item.min_stock_level) return 'Low Stock';
    if (item.quantity >= item.max_stock_level) return 'Overstocked';
    return 'Normal';
  };

  const getStockLevelColor = (item) => {
    if (!item) return 'default';
    if (item.quantity <= item.min_stock_level) return 'error';
    if (item.quantity >= item.max_stock_level) return 'warning';
    return 'success';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalItems: inventory.length,
    lowStock: inventory.filter(item => item.quantity <= item.min_stock_level).length,
    totalValue: inventory.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.purchase_price)), 0).toFixed(2),
    activeTransactions: transactions.filter(t => t.type === 'IN' || t.type === 'OUT').length
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Inventory Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Item
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={InventoryIcon}
            title="Active Items"
            value={inventory.filter(item => item.status === 'active').length}
            iconColor="#9C27B0"
            gradientColor="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AlertIcon}
            title="Low Stock Items"
            value={inventory.filter(item => Number(item.quantity) <= Number(item.min_stock_level)).length}
            iconColor="#D32F2F"
            gradientColor="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={ManufacturingIcon}
            title="Manufacturing Orders"
            value={new Set(transactions.filter(t => t.reference.startsWith('MO-')).map(t => t.reference)).size}
            iconColor="#ED6C02"
            gradientColor="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={ValueIcon}
            title="Total Inventory Value"
            value={formatCurrency(inventory.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.purchase_price)), 0))}
            iconColor="#0288D1"
            gradientColor="info"
          />
        </Grid>
      </Grid>

      {/* Tabs and Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab label="Inventory Items" />
          <Tab label="Transactions History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell align="right">Purchase Price</TableCell>
                  <TableCell align="right">Selling Price</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.product_type}</TableCell>
                    <TableCell align="right">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStockLevelLabel(item)}
                        color={getStockLevelColor(item)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.purchase_price)}</TableCell>
                    <TableCell align="right">
                      {item.product_type === 'finished_good'
                        ? formatCurrency(item.selling_price)
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(item)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item.id)}
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
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.product_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type}
                        color={transaction.type === 'IN' ? 'success' : transaction.type === 'OUT' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>{transaction.reference}</TableCell>
                    <TableCell>{transaction.notes}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenTransactionDialog(transaction)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Keep your existing dialog with the current form fields */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedItem ? 'Edit Inventory Item' : 'New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="product_name"
                value={formData.product_name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Product Type</InputLabel>
                <Select
                  name="product_type"
                  value={formData.product_type}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="raw_material">Raw Material</MenuItem>
                  <MenuItem value="finished_good">Finished Good</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Stock Level"
                name="min_stock_level"
                type="number"
                value={formData.min_stock_level}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Stock Level"
                name="max_stock_level"
                type="number"
                value={formData.max_stock_level}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Price"
                name="purchase_price"
                type="number"
                value={formData.purchase_price}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Selling Price"
                name="selling_price"
                type="number"
                value={formData.selling_price}
                onChange={handleInputChange}
                disabled={formData.product_type === 'raw_material'}
                helperText={formData.product_type === 'raw_material' ? 'Not applicable for raw materials' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openTransactionDialog}
        onClose={handleCloseTransactionDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedItem ? 'Edit Transaction' : 'New Transaction'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={transactionData.date}
                onChange={handleTransactionInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={transactionData.type}
                  onChange={handleTransactionInputChange}
                >
                  <MenuItem value="revenue">Revenue</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={transactionData.amount}
                onChange={handleTransactionInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={transactionData.category}
                  onChange={handleTransactionInputChange}
                >
                  <MenuItem value="production">Production</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="lease">Lease</MenuItem>
                  <MenuItem value="royalty">Royalty</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={transactionData.description}
                onChange={handleTransactionInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransactionDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleTransactionSubmit}>
            {selectedItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;