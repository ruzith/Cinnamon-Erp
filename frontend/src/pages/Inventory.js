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
  Clear as ClearIcon,
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
      {value === index && children}
    </div>
  );
};

const Inventory = () => {
  const [tabValue, setTabValue] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cuttingTasks, setCuttingTasks] = useState([]);
  const [cinnamonAssignments, setCinnamonAssignments] = useState([]);
  const [manufacturingPurchases, setManufacturingPurchases] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    category: 'raw_material',
    quantity: '',
    unit: '',
    min_stock_level: '',
    max_stock_level: '',
    location: '',
    purchase_price: '',
    selling_price: '',
    description: '',
    status: 'active',
    cutting_assignment_id: '',
    purchase_assignment_id: '',
    manufacturing_id: ''
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

  const [productFilter, setProductFilter] = useState('');
  const [dateFilters, setDateFilters] = useState({
    start_date: '',
    end_date: ''
  });

  const { formatCurrency } = useCurrencyFormatter();

  useEffect(() => {
    fetchInventory();
    fetchTransactions();
    fetchCuttingTasks();
    fetchCinnamonAssignments();
    fetchManufacturingPurchases();
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

  const fetchCuttingTasks = async () => {
    try {
      const response = await axios.get('/api/cutting/tasks');
      setCuttingTasks(response.data);
    } catch (error) {
      console.error('Error fetching cutting tasks:', error);
    }
  };

  const fetchCinnamonAssignments = async () => {
    try {
      const response = await axios.get('/api/manufacturing/assignments');
      setCinnamonAssignments(response.data);
    } catch (error) {
      console.error('Error fetching cinnamon assignments:', error);
    }
  };

  const fetchManufacturingPurchases = async () => {
    try {
      const response = await axios.get('/api/manufacturing/invoices');
      console.log('Manufacturing Purchases Response:', response.data);
      const purchases = Array.isArray(response.data) ? response.data :
                       (response.data?.invoices || response.data?.data || []);
      setManufacturingPurchases(purchases);
    } catch (error) {
      console.error('Error fetching manufacturing purchases:', error);
      setManufacturingPurchases([]);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        product_name: item.product_name || '',
        category: item.category || 'raw_material',
        quantity: item.quantity || '',
        unit: item.unit || '',
        min_stock_level: item.min_stock_level || '',
        max_stock_level: item.max_stock_level || '',
        location: item.location || '',
        purchase_price: item.purchase_price || '',
        selling_price: item.selling_price || '',
        description: item.description || '',
        status: item.status || 'active',
        cutting_assignment_id: item.cutting_assignment_id || '',
        purchase_assignment_id: item.purchase_assignment_id || '',
        manufacturing_id: item.manufacturing_id || ''
      });

      if (item.category === 'raw_material') {
        fetchCuttingTasks();
        fetchCinnamonAssignments();
      }
    } else {
      setSelectedItem(null);
      setFormData({
        product_name: '',
        category: 'raw_material',
        quantity: '',
        unit: '',
        min_stock_level: '',
        max_stock_level: '',
        location: '',
        purchase_price: '',
        selling_price: '',
        description: '',
        status: 'active',
        cutting_assignment_id: '',
        purchase_assignment_id: '',
        manufacturing_id: ''
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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Fetch manufacturing purchases when category changes to finished_good
    if (name === 'category' && value === 'finished_good') {
      fetchManufacturingPurchases();
    }
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
        quantity: Number(formData.quantity) || 0,
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

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      const matchesProduct = !productFilter ||
        transaction.product_name?.toLowerCase().includes(productFilter.toLowerCase());

      const transactionDate = new Date(transaction.created_at);
      const matchesStartDate = !dateFilters.start_date ||
        transactionDate >= new Date(dateFilters.start_date);
      const matchesEndDate = !dateFilters.end_date ||
        transactionDate <= new Date(dateFilters.end_date);

      return matchesProduct && matchesStartDate && matchesEndDate;
    });
  }, [transactions, productFilter, dateFilters]);

  const uniqueProducts = React.useMemo(() => {
    const products = new Set(transactions.map(t => t.product_name));
    return Array.from(products).filter(Boolean).sort();
  }, [transactions]);

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
            title="Orders"
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
          <Tab label="Stock History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell align="right">Price/Assignment</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.category === 'finished_good' ? 'Finished Good' : 'Raw Material'}
                        color={item.category === 'finished_good' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
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
                    <TableCell align="right">
                      {item.category === 'finished_good'
                        ? (
                            <>
                              {formatCurrency(item.purchase_price)}
                              {item.manufacturing_id && Array.isArray(manufacturingPurchases) &&
                                manufacturingPurchases.find(p => p.id === item.manufacturing_id) &&
                                ` (Invoice: ${manufacturingPurchases.find(p => p.id === item.manufacturing_id).invoice_number})`}
                            </>
                          )
                        : (
                            <>
                              {item.cutting_assignment_id && cuttingTasks.find(t => t.id === item.cutting_assignment_id) &&
                                `Cutting: ${cuttingTasks.find(t => t.id === item.cutting_assignment_id).land_number}`}
                              {item.cutting_assignment_id && item.purchase_assignment_id && ' | '}
                              {item.purchase_assignment_id && cinnamonAssignments.find(a => a.id === item.purchase_assignment_id) &&
                                `Purchase: ${cinnamonAssignments.find(a => a.id === item.purchase_assignment_id).raw_material_name}`}
                            </>
                          )
                      }
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
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="product-filter-label">Product</InputLabel>
                  <Select
                    labelId="product-filter-label"
                    value={productFilter}
                    label="Product"
                    onChange={(e) => setProductFilter(e.target.value)}
                    endAdornment={
                      productFilter && (
                        <IconButton
                          size="small"
                          sx={{ mr: 2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductFilter('');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )
                    }
                  >
                    <MenuItem value="">
                      <em>All Products</em>
                    </MenuItem>
                    {uniqueProducts.map((product) => (
                      <MenuItem key={product} value={product}>
                        {product}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  size="small"
                  value={dateFilters.start_date}
                  onChange={(e) => setDateFilters(prev => ({
                    ...prev,
                    start_date: e.target.value
                  }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: dateFilters.start_date && (
                      <IconButton
                        size="small"
                        onClick={() => setDateFilters(prev => ({
                          ...prev,
                          start_date: ''
                        }))}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  size="small"
                  value={dateFilters.end_date}
                  onChange={(e) => setDateFilters(prev => ({
                    ...prev,
                    end_date: e.target.value
                  }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: dateFilters.end_date && (
                      <IconButton
                        size="small"
                        onClick={() => setDateFilters(prev => ({
                          ...prev,
                          end_date: ''
                        }))}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ),
                    inputProps: {
                      min: dateFilters.start_date || undefined
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const isIncrease = transaction.type === 'IN';
                  return (
                    <TableRow key={transaction.id} hover>
                      <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.product_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.type}
                          color={isIncrease ? 'success' : transaction.type === 'OUT' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={isIncrease ? 'success.main' : 'error.main'}
                        >
                          {isIncrease ? '+' : '-'}{Math.abs(transaction.quantity)}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.reference}</TableCell>
                      <TableCell>{transaction.notes}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="product-filter-label-2">Product</InputLabel>
                  <Select
                    labelId="product-filter-label-2"
                    value={productFilter}
                    label="Product"
                    onChange={(e) => setProductFilter(e.target.value)}
                    endAdornment={
                      productFilter && (
                        <IconButton
                          size="small"
                          sx={{ mr: 2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductFilter('');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )
                    }
                  >
                    <MenuItem value="">
                      <em>All Products</em>
                    </MenuItem>
                    {uniqueProducts.map((product) => (
                      <MenuItem key={product} value={product}>
                        {product}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  size="small"
                  value={dateFilters.start_date}
                  onChange={(e) => setDateFilters(prev => ({
                    ...prev,
                    start_date: e.target.value
                  }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: dateFilters.start_date && (
                      <IconButton
                        size="small"
                        onClick={() => setDateFilters(prev => ({
                          ...prev,
                          start_date: ''
                        }))}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  size="small"
                  value={dateFilters.end_date}
                  onChange={(e) => setDateFilters(prev => ({
                    ...prev,
                    end_date: e.target.value
                  }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: dateFilters.end_date && (
                      <IconButton
                        size="small"
                        onClick={() => setDateFilters(prev => ({
                          ...prev,
                          end_date: ''
                        }))}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ),
                    inputProps: {
                      min: dateFilters.start_date || undefined
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const isIncrease = transaction.type === 'IN';
                  return (
                    <TableRow key={transaction.id} hover>
                      <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.product_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.type}
                          color={isIncrease ? 'success' : transaction.type === 'OUT' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={isIncrease ? 'success.main' : 'error.main'}
                        >
                          {isIncrease ? '+' : '-'}{Math.abs(transaction.quantity)}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.reference}</TableCell>
                      <TableCell>{transaction.notes}</TableCell>
                    </TableRow>
                  );
                })}
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
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
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
                disabled={formData.category === 'raw_material'}
                helperText={formData.category === 'raw_material' ? 'Not applicable for raw materials' : ''}
              />
            </Grid>
            {formData.category === 'raw_material' && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Cutting Task</InputLabel>
                    <Select
                      name="cutting_assignment_id"
                      value={formData.cutting_assignment_id}
                      onChange={handleInputChange}
                      label="Cutting Task"
                    >
                      <MenuItem value="">None</MenuItem>
                      {cuttingTasks.map((task) => (
                        <MenuItem key={task.id} value={task.id}>
                          {`Land: ${task.land_number} - ${task.contractor_name} (${new Date(task.date).toLocaleDateString()}) - Progress: ${task.progress}%`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Purchase Assignment</InputLabel>
                    <Select
                      name="purchase_assignment_id"
                      value={formData.purchase_assignment_id}
                      onChange={handleInputChange}
                      label="Purchase Assignment"
                    >
                      <MenuItem value="">None</MenuItem>
                      {cinnamonAssignments.map((assignment) => (
                        <MenuItem key={assignment.id} value={assignment.id}>
                          {`${assignment.raw_material_name} - ${assignment.raw_material_quantity}kg (${assignment.contractor_name}) - ${assignment.status}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            {formData.category === 'finished_good' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Manufacturing Purchase</InputLabel>
                  <Select
                    name="manufacturing_id"
                    value={formData.manufacturing_id || ''}
                    onChange={handleInputChange}
                    label="Manufacturing Purchase"
                  >
                    <MenuItem value="">None</MenuItem>
                    {Array.isArray(manufacturingPurchases) && manufacturingPurchases.length > 0 ? (
                      manufacturingPurchases.map((purchase) => (
                        <MenuItem key={purchase.id} value={purchase.id}>
                          {`Invoice: ${purchase.invoice_number || 'N/A'} - ${purchase.supplier_name || 'Unknown'} - ${formatCurrency(purchase.total_amount || 0)}`}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No manufacturing purchases available</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
            )}
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