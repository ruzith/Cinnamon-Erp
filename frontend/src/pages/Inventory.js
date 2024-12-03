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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
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

  const getStockLevelColor = (item) => {
    if (item.quantity <= item.minStockLevel) return 'error';
    if (item.quantity >= item.maxStockLevel) return 'warning';
    return 'success';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Inventory Items" />
          <Tab label="Transactions History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Typography variant="h6">Inventory Management</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog()}
            >
              Add New Item
            </Button>
          </div>

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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>${item.unitPrice}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${item.quantity} ${item.unit}`}
                        color={getStockLevelColor(item)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenTransactionDialog(item, 'in')}>
                        <AddCircleIcon color="success" />
                      </IconButton>
                      <IconButton onClick={() => handleOpenTransactionDialog(item, 'out')}>
                        <RemoveCircleIcon color="error" />
                      </IconButton>
                      <IconButton onClick={() => handleOpenDialog(item)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(item._id)}>
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
          <Typography variant="h6" sx={{ mb: 2 }}>Transaction History</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.productId.productName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.type === 'in' ? 'Stock In' : 'Stock Out'}
                        color={transaction.type === 'in' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>{transaction.reason}</TableCell>
                    <TableCell>{transaction.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Item Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  name="productName"
                  label="Product Name"
                  fullWidth
                  value={formData.productName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="category"
                  label="Category"
                  fullWidth
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="quantity"
                  label="Initial Quantity"
                  type="number"
                  fullWidth
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="unit"
                  label="Unit"
                  fullWidth
                  value={formData.unit}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="minStockLevel"
                  label="Minimum Stock Level"
                  type="number"
                  fullWidth
                  value={formData.minStockLevel}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="maxStockLevel"
                  label="Maximum Stock Level"
                  type="number"
                  fullWidth
                  value={formData.maxStockLevel}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="location"
                  label="Storage Location"
                  fullWidth
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="unitPrice"
                  label="Unit Price"
                  type="number"
                  fullWidth
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
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
            <Button onClick={handleSubmit} color="primary">
              {selectedItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Transaction Dialog */}
        <Dialog 
          open={openTransactionDialog} 
          onClose={handleCloseTransactionDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {transactionData.type === 'in' ? 'Stock In' : 'Stock Out'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Product: {selectedItem?.productName}
                </Typography>
                <Typography variant="subtitle2">
                  Current Stock: {selectedItem?.quantity} {selectedItem?.unit}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="quantity"
                  label="Quantity"
                  type="number"
                  fullWidth
                  value={transactionData.quantity}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="reason"
                  label="Reason"
                  fullWidth
                  value={transactionData.reason}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Additional Notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={transactionData.notes}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTransactionDialog}>Cancel</Button>
            <Button onClick={handleTransactionSubmit} color="primary">
              Process Transaction
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Inventory; 