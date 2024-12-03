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
  LocalShipping as ShippingIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import axios from 'axios';

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
    productName: '',
    category: '',
    quantity: '',
    unit: '',
    minStockLevel: '',
    maxStockLevel: '',
    location: '',
    description: '',
    unitPrice: ''
  });

  const [transactionData, setTransactionData] = useState({
    productId: '',
    type: 'in',
    quantity: '',
    reason: '',
    notes: ''
  });

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
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minStockLevel: item.minStockLevel,
        maxStockLevel: item.maxStockLevel,
        location: item.location,
        description: item.description,
        unitPrice: item.unitPrice
      });
    } else {
      setSelectedItem(null);
      setFormData({
        productName: '',
        category: '',
        quantity: '',
        unit: '',
        minStockLevel: '',
        maxStockLevel: '',
        location: '',
        description: '',
        unitPrice: ''
      });
    }
    setOpenDialog(true);
  };

  const handleOpenTransactionDialog = (item, type) => {
    setSelectedItem(item);
    setTransactionData({
      productId: item._id,
      type: type,
      quantity: '',
      reason: '',
      notes: ''
    });
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
      if (selectedItem) {
        await axios.put(`/api/inventory/${selectedItem._id}`, formData);
      } else {
        await axios.post('/api/inventory', formData);
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
      await axios.post('/api/inventory/transactions', transactionData);
      fetchInventory();
      fetchTransactions();
      handleCloseTransactionDialog();
    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await axios.delete(`/api/inventory/${itemId}`);
        fetchInventory();
      } catch (error) {
        console.error('Error deleting inventory item:', error);
      }
    }
  };

  const getStockLevelLabel = (item) => {
    if (!item) return 'Unknown';
    if (item.quantity <= item.minStockLevel) return 'Low Stock';
    if (item.quantity >= item.maxStockLevel) return 'Overstocked';
    return 'Normal';
  };

  const getStockLevelColor = (item) => {
    if (!item) return 'default';
    if (item.quantity <= item.minStockLevel) return 'error';
    if (item.quantity >= item.maxStockLevel) return 'warning';
    return 'success';
  };

  // Calculate summary statistics
  const summaryStats = {
    totalItems: inventory.length,
    lowStock: inventory.filter(item => item.quantity <= item.minStockLevel).length,
    totalValue: inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2),
    activeTransactions: transactions.filter(t => t.status === 'pending').length
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
              <InventoryIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="textSecondary">Total Items</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.totalItems}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(211, 47, 47, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AlertIcon sx={{ color: 'error.main', mr: 1 }} />
              <Typography color="textSecondary">Low Stock Items</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.lowStock}</Typography>
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
              <TrendingIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography color="textSecondary">Total Value</Typography>
            </Box>
            <Typography variant="h4">${summaryStats.totalValue}</Typography>
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
              <ShippingIcon sx={{ color: 'warning.main', mr: 1 }} />
              <Typography color="textSecondary">Active Transactions</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.activeTransactions}</Typography>
          </Paper>
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

        <Box sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item._id} hover>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>${item.unitPrice}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStockLevelLabel(item)}
                        color={getStockLevelColor(item)}
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
                        onClick={() => handleDelete(item._id)}
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
        </Box>
      </Paper>

      {/* Keep your existing dialog with the current form fields */}
    </Box>
  );
};

export default Inventory; 