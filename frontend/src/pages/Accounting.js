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
  VisibilityIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Balance as BalanceIcon,
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

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'asset':
        return 'primary';
      case 'liability':
        return 'error';
      case 'equity':
        return 'success';
      case 'revenue':
        return 'info';
      case 'expense':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Accounting & Finance
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(76, 175, 80, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IncomeIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography color="textSecondary">Total Income</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'success.main' }}>
              ${summary.profitLoss.revenue.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(244, 67, 54, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ExpenseIcon sx={{ color: 'error.main', mr: 1 }} />
              <Typography color="textSecondary">Total Expenses</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'error.main' }}>
              ${summary.profitLoss.expenses.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
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
              <BalanceIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="textSecondary">Net Income</Typography>
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                color: summary.profitLoss.netProfit >= 0 ? 'success.main' : 'error.main'
              }}
            >
              ${summary.profitLoss.netProfit.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab label="Transactions" />
          <Tab label="Accounts" />
        </Tabs>

        {/* Transactions Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Financial Transactions
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenTransactionDialog()}
              >
                New Transaction
              </Button>
            </Box>

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
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction._id} hover>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.type}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.account}</TableCell>
                      <TableCell 
                        sx={{ 
                          color: transaction.type === 'income' ? 'success.main' : 'error.main'
                        }}
                      >
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status}
                          color={getStatusColor(transaction.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={() => handleOpenTransactionDialog(transaction)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteTransaction(transaction._id)}
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
        </TabPanel>

        {/* Accounts Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Chart of Accounts
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenAccountDialog()}
              >
                New Account
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Account Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account._id} hover>
                      <TableCell>{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={account.type}
                          color={getAccountTypeColor(account.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{account.category}</TableCell>
                      <TableCell 
                        sx={{ 
                          color: account.balance >= 0 ? 'success.main' : 'error.main'
                        }}
                      >
                        ${Math.abs(account.balance).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={account.status}
                          color={getStatusColor(account.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={() => handleOpenAccountDialog(account)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteAccount(account._id)}
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
    </Box>
  );
};

export default Accounting; 