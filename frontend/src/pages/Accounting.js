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
  Card,
  CardContent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';
import axios from 'axios';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Accounting = () => {
  const [tabValue, setTabValue] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({
    assets: {
      total: 0,
      currentAssets: 0,
      fixedAssets: 0
    },
    liabilities: {
      total: 0,
      currentLiabilities: 0,
      longTermLiabilities: 0
    },
    equity: {
      total: 0
    },
    profitLoss: {
      revenue: 0,
      expenses: 0,
      netProfit: 0
    },
    ratios: {
      currentRatio: 0,
      debtToEquity: 0,
      quickRatio: 0
    },
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0
  });
  
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [transactionFormData, setTransactionFormData] = useState({
    date: '',
    type: 'income',
    category: '',
    amount: '',
    description: '',
    account: '',
    reference: '',
    status: 'completed',
    paymentMethod: '',
    notes: ''
  });

  const [accountFormData, setAccountFormData] = useState({
    name: '',
    type: 'asset',
    number: '',
    description: '',
    balance: '',
    status: 'active'
  });

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchSummary();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/accounting/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/accounting/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/accounting/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenTransactionDialog = (transaction = null) => {
    if (transaction) {
      setSelectedTransaction(transaction);
      setTransactionFormData({
        date: transaction.date?.split('T')[0] || '',
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        account: transaction.account._id,
        reference: transaction.reference,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        notes: transaction.notes
      });
    } else {
      setSelectedTransaction(null);
      setTransactionFormData({
        date: '',
        type: 'income',
        category: '',
        amount: '',
        description: '',
        account: '',
        reference: '',
        status: 'completed',
        paymentMethod: '',
        notes: ''
      });
    }
    setOpenTransactionDialog(true);
  };

  const handleOpenAccountDialog = (account = null) => {
    if (account) {
      setSelectedAccount(account);
      setAccountFormData({
        name: account.name,
        type: account.type,
        number: account.number,
        description: account.description,
        balance: account.balance,
        status: account.status
      });
    } else {
      setSelectedAccount(null);
      setAccountFormData({
        name: '',
        type: 'asset',
        number: '',
        description: '',
        balance: '',
        status: 'active'
      });
    }
    setOpenAccountDialog(true);
  };

  const handleCloseTransactionDialog = () => {
    setOpenTransactionDialog(false);
    setSelectedTransaction(null);
  };

  const handleCloseAccountDialog = () => {
    setOpenAccountDialog(false);
    setSelectedAccount(null);
  };

  const handleTransactionInputChange = (e) => {
    setTransactionFormData({
      ...transactionFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAccountInputChange = (e) => {
    setAccountFormData({
      ...accountFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTransaction) {
        await axios.put(`/api/accounting/transactions/${selectedTransaction._id}`, transactionFormData);
      } else {
        await axios.post('/api/accounting/transactions', transactionFormData);
      }
      fetchTransactions();
      fetchSummary();
      handleCloseTransactionDialog();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAccount) {
        await axios.put(`/api/accounting/accounts/${selectedAccount._id}`, accountFormData);
      } else {
        await axios.post('/api/accounting/accounts', accountFormData);
      }
      fetchAccounts();
      handleCloseAccountDialog();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`/api/accounting/transactions/${transactionId}`);
        fetchTransactions();
        fetchSummary();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await axios.delete(`/api/accounting/accounts/${accountId}`);
        fetchAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'income':
        return 'success';
      case 'expense':
        return 'error';
      case 'transfer':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Financial Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Income
              </Typography>
              <Typography variant="h5" component="div" color="success.main">
                ${summary.profitLoss.revenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h5" component="div" color="error.main">
                ${summary.profitLoss.expenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Net Income
              </Typography>
              <Typography 
                variant="h5" 
                component="div" 
                color={summary.profitLoss.netProfit >= 0 ? 'success.main' : 'error.main'}
              >
                ${summary.profitLoss.netProfit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Transactions" />
          <Tab label="Accounts" />
        </Tabs>

        {/* Transactions Tab */}
        <TabPanel value={tabValue} index={0}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Typography variant="h6">Financial Transactions</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenTransactionDialog()}
            >
              New Transaction
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.type}
                        color={getTransactionTypeColor(transaction.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.account?.name}</TableCell>
                    <TableCell>
                      <Typography
                        color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                      >
                        ${transaction.amount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.status}
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenTransactionDialog(transaction)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteTransaction(transaction._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Accounts Tab */}
        <TabPanel value={tabValue} index={1}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Typography variant="h6">Chart of Accounts</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenAccountDialog()}
            >
              New Account
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account Number</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell>{account.number}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{account.type}</TableCell>
                    <TableCell>${account.balance}</TableCell>
                    <TableCell>
                      <Chip 
                        label={account.status}
                        color={getStatusColor(account.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenAccountDialog(account)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteAccount(account._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Transaction Dialog */}
        <Dialog 
          open={openTransactionDialog} 
          onClose={handleCloseTransactionDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedTransaction ? 'Edit Transaction' : 'New Transaction'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  name="date"
                  label="Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={transactionFormData.date}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={transactionFormData.type}
                    label="Type"
                    onChange={handleTransactionInputChange}
                  >
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="transfer">Transfer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="amount"
                  label="Amount"
                  type="number"
                  fullWidth
                  value={transactionFormData.amount}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Account</InputLabel>
                  <Select
                    name="account"
                    value={transactionFormData.account}
                    label="Account"
                    onChange={handleTransactionInputChange}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account._id} value={account._id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="category"
                  label="Category"
                  fullWidth
                  value={transactionFormData.category}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={transactionFormData.status}
                    label="Status"
                    onChange={handleTransactionInputChange}
                  >
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="reference"
                  label="Reference Number"
                  fullWidth
                  value={transactionFormData.reference}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="paymentMethod"
                  label="Payment Method"
                  fullWidth
                  value={transactionFormData.paymentMethod}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={transactionFormData.description}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={transactionFormData.notes}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTransactionDialog}>Cancel</Button>
            <Button onClick={handleTransactionSubmit} color="primary">
              {selectedTransaction ? 'Update Transaction' : 'Create Transaction'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Account Dialog */}
        <Dialog 
          open={openAccountDialog} 
          onClose={handleCloseAccountDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedAccount ? 'Edit Account' : 'New Account'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  name="name"
                  label="Account Name"
                  fullWidth
                  value={accountFormData.name}
                  onChange={handleAccountInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="number"
                  label="Account Number"
                  fullWidth
                  value={accountFormData.number}
                  onChange={handleAccountInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={accountFormData.type}
                    label="Type"
                    onChange={handleAccountInputChange}
                  >
                    <MenuItem value="asset">Asset</MenuItem>
                    <MenuItem value="liability">Liability</MenuItem>
                    <MenuItem value="equity">Equity</MenuItem>
                    <MenuItem value="revenue">Revenue</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="balance"
                  label="Initial Balance"
                  type="number"
                  fullWidth
                  value={accountFormData.balance}
                  onChange={handleAccountInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={accountFormData.description}
                  onChange={handleAccountInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={accountFormData.status}
                    label="Status"
                    onChange={handleAccountInputChange}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAccountDialog}>Cancel</Button>
            <Button onClick={handleAccountSubmit} color="primary">
              {selectedAccount ? 'Update Account' : 'Create Account'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Accounting; 