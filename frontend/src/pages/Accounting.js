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
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Balance as BalanceIcon,
  FileDownload as FileDownloadIcon,
  AttachMoney,
  Payments as PaymentsIcon,
  TrendingUp,
  AccountBalanceWallet,
} from '@mui/icons-material';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDate } from '../utils/dateUtils';
import { useCurrencyFormatter } from '../utils/currencyUtils';
import SummaryCard from '../components/common/SummaryCard';

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(weekOfYear);

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && children}
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
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: 'production',
    amount: '',
    description: '',
    account: '',
    reference: '',
    notes: '',
    status: 'draft'
  });

  const [accountFormData, setAccountFormData] = useState({
    name: '',
    type: 'asset',
    number: '',
    description: '',
    balance: '',
    status: 'active'
  });

  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);

  const [reportData, setReportData] = useState({
    trialBalance: null,
    profitLoss: null,
    balanceSheet: null,
    cashFlow: null
  });

  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  const { formatCurrency } = useCurrencyFormatter();

  const validTypes = ['revenue', 'expense', 'credit_payment', 'manufacturing_payment', 'salary'];
  const validCategories = [
    'sales_income',
    'production_expense',
    'maintenance_expense',
    'royalty_payment',
    'lease_payment',
    'salary_payment',
    'credit_contribution',
    'manufacturing_cost',
    'raw_material_payment',
    'utility_expense',
    'other_expense'
  ];

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedAccount && dateRange[0] && dateRange[1]) {
      fetchLedgerEntries();
    }
  }, [selectedAccount, dateRange]);

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

  const fetchLedgerEntries = async () => {
    try {
      const response = await axios.get(`/api/accounting/ledger/${selectedAccount}`, {
        params: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        }
      });
      setLedgerEntries(response.data);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
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
        account: transaction.account.id,
        reference: transaction.reference,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        notes: transaction.notes
      });
    } else {
      setSelectedTransaction(null);
      setTransactionFormData({
        date: '',
        type: 'expense',
        category: 'production',
        amount: '',
        description: '',
        account: '',
        reference: '',
        status: 'draft',
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
      [e.target.name]: e.target.name === 'amount' ? Number(e.target.value) : e.target.value,
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
      const response = await axios.post('/api/accounting/transactions', {
        ...transactionFormData,
        status: transactionFormData.status || 'draft'
      });
      fetchTransactions();
      fetchSummary();
      handleCloseTransactionDialog();
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert(error.response?.data?.message || 'Error creating transaction');
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAccount) {
        await axios.put(`/api/accounting/accounts/${selectedAccount.id}`, accountFormData);
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
      case 'revenue':
        return 'success';
      case 'expense':
      case 'salary':
        return 'error';
      case 'credit_payment':
        return 'warning';
      case 'manufacturing_payment':
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

  const handleGenerateReport = async (reportType) => {
    try {
      const response = await axios.get(`/api/accounting/reports/${reportType}`, {
        params: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        }
      });

      setReportData(prev => ({
        ...prev,
        [reportType]: response.data
      }));

      setCurrentReport(reportType);
      setOpenReportDialog(true);
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
    }
  };

  const handleExportReport = async (type, data) => {
    try {
      const response = await axios.post(`/api/accounting/reports/${type}/export`, {
        data,
        format: 'excel', // You can make this configurable if you want to support multiple formats
        dateRange: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        }
      }, {
        responseType: 'blob' // Important for handling file downloads
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report-${dayjs().format('YYYY-MM-DD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error exporting ${type} report:`, error);
    }
  };

  const ReportDialog = ({ open, onClose, type, data }) => {
    if (!data) return null;

    const renderReportContent = () => {
      switch (type) {
        case 'trial-balance':
          return (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Account Code</TableCell>
                    <TableCell>Account Name</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.accounts?.map((account) => (
                    <TableRow key={account.code}>
                      <TableCell>{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell align="right">${(account.debit || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">${(account.credit || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2}><strong>Total</strong></TableCell>
                    <TableCell align="right"><strong>${(data.totalDebit || 0).toFixed(2)}</strong></TableCell>
                    <TableCell align="right"><strong>${(data.totalCredit || 0).toFixed(2)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          );

        case 'profit-loss':
          return (
            <Box>
              <Typography variant="h6" gutterBottom>Revenue</Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    {data.revenue?.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">${(item.total || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Total Revenue</strong></TableCell>
                      <TableCell align="right"><strong>${(data.totalRevenue || 0).toFixed(2)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Expenses</Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    {data.expenses?.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">${(item.total || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Total Expenses</strong></TableCell>
                      <TableCell align="right"><strong>${(data.totalExpenses || 0).toFixed(2)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h6">
                  Net Profit: {formatCurrency(data.netProfit || 0)}
                </Typography>
              </Box>
            </Box>
          );

        case 'balance-sheet':
          return (
            <Box>
              {/* Assets Section */}
              <Typography variant="h6" gutterBottom>Assets</Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={2}><Typography variant="subtitle1">Current Assets</Typography></TableCell>
                    </TableRow>
                    {data.assets?.current?.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total || 0)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Total Current Assets</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(data.assets?.totalCurrent || 0)}</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={2}><Typography variant="subtitle1" sx={{ mt: 2 }}>Fixed Assets</Typography></TableCell>
                    </TableRow>
                    {data.assets?.fixed?.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total || 0)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Total Fixed Assets</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(data.assets?.totalFixed || 0)}</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell><strong>Total Assets</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(data.assets?.total || 0)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Liabilities Section */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Liabilities</Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={2}><Typography variant="subtitle1">Current Liabilities</Typography></TableCell>
                    </TableRow>
                    {data.liabilities?.current?.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total || 0)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Total Current Liabilities</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(data.liabilities?.totalCurrent || 0)}</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={2}><Typography variant="subtitle1" sx={{ mt: 2 }}>Long-term Liabilities</Typography></TableCell>
                    </TableRow>
                    {data.liabilities?.longTerm?.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total || 0)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Total Long-term Liabilities</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(data.liabilities?.totalLongTerm || 0)}</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell><strong>Total Liabilities</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(data.liabilities?.total || 0)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Equity Section */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Equity</Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    {data.equity?.items?.map((item) => (
                      <TableRow key={item.code}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total || 0)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Total Equity</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(data.equity?.total || 0)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Total Liabilities and Equity */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h6">
                  Total Liabilities and Equity: {formatCurrency((data.liabilities?.total || 0) + (data.equity?.total || 0))}
                </Typography>
              </Box>
            </Box>
          );

        case 'cash-flow':
          return (
            <Box>
              {/* Operating Activities */}
              <Typography variant="h6" gutterBottom>Operating Activities</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Inflows */}
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle2">Cash Inflows</Typography>
                      </TableCell>
                    </TableRow>
                    {data.operating?.inflows?.map((item, index) => (
                      <TableRow key={`inflow-${index}`}>
                        <TableCell>{item.description || 'Operating Inflow'}</TableCell>
                        <TableCell align="right">{formatCurrency(Math.abs(item.credit - item.debit))}</TableCell>
                      </TableRow>
                    ))}

                    {/* Outflows */}
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle2">Cash Outflows</Typography>
                      </TableCell>
                    </TableRow>
                    {data.operating?.outflows?.map((item, index) => (
                      <TableRow key={`outflow-${index}`}>
                        <TableCell>{item.description || 'Operating Outflow'}</TableCell>
                        <TableCell align="right">-${formatCurrency(Math.abs(item.debit - item.credit))}</TableCell>
                      </TableRow>
                    ))}

                    {/* Operating Total */}
                    <TableRow>
                      <TableCell><strong>Net Cash from Operations</strong></TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(data.operating?.total || 0)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Investing Activities */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Investing Activities</Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    {/* Inflows */}
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle2">Cash Inflows</Typography>
                      </TableCell>
                    </TableRow>
                    {data.investing?.inflows?.map((item, index) => (
                      <TableRow key={`invest-in-${index}`}>
                        <TableCell>{item.description || 'Investment Inflow'}</TableCell>
                        <TableCell align="right">{formatCurrency(Math.abs(item.credit - item.debit))}</TableCell>
                      </TableRow>
                    ))}

                    {/* Outflows */}
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle2">Cash Outflows</Typography>
                      </TableCell>
                    </TableRow>
                    {data.investing?.outflows?.map((item, index) => (
                      <TableRow key={`invest-out-${index}`}>
                        <TableCell>{item.description || 'Investment Outflow'}</TableCell>
                        <TableCell align="right">-${formatCurrency(Math.abs(item.debit - item.credit))}</TableCell>
                      </TableRow>
                    ))}

                    {/* Investing Total */}
                    <TableRow>
                      <TableCell><strong>Net Cash from Investing</strong></TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(data.investing?.total || 0)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Financing Activities */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Financing Activities</Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    {/* Inflows */}
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle2">Cash Inflows</Typography>
                      </TableCell>
                    </TableRow>
                    {data.financing?.inflows?.map((item, index) => (
                      <TableRow key={`finance-in-${index}`}>
                        <TableCell>{item.description || 'Financing Inflow'}</TableCell>
                        <TableCell align="right">{formatCurrency(Math.abs(item.credit - item.debit))}</TableCell>
                      </TableRow>
                    ))}

                    {/* Outflows */}
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle2">Cash Outflows</Typography>
                      </TableCell>
                    </TableRow>
                    {data.financing?.outflows?.map((item, index) => (
                      <TableRow key={`finance-out-${index}`}>
                        <TableCell>{item.description || 'Financing Outflow'}</TableCell>
                        <TableCell align="right">-${formatCurrency(Math.abs(item.debit - item.credit))}</TableCell>
                      </TableRow>
                    ))}

                    {/* Financing Total */}
                    <TableRow>
                      <TableCell><strong>Net Cash from Financing</strong></TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(data.financing?.total || 0)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Net Cash Flow */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h6">
                  Net Change in Cash: {formatCurrency(data.netCashFlow || 0)}
                </Typography>
              </Box>
            </Box>
          );

        default:
          return <Typography>Report type not supported</Typography>;
      }
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Report
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {renderReportContent()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button
            onClick={() => handleExportReport(type, data)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
            color="primary"
          >
            Export to Excel
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const summaryStats = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(acc => acc.status === 'active').length,
    totalTransactions: transactions.length,
    totalBalance: accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Accounting Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenAccountDialog()}
          >
            New Account
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenTransactionDialog()}
          >
            New Transaction
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AccountBalanceIcon}
            title="Total Revenue"
            value={formatCurrency(summaryStats.totalRevenue)}
            iconColor="#9C27B0"
            gradientColor="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={PaymentsIcon}
            title="Total Expenses"
            value={formatCurrency(summaryStats.totalExpenses)}
            iconColor="#D32F2F"
            gradientColor="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={TrendingUp}
            title="Net Income"
            value={formatCurrency(summaryStats.netIncome)}
            iconColor="#ED6C02"
            gradientColor="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AccountBalanceWallet}
            title="Cash Balance"
            value={formatCurrency(summaryStats.cashBalance)}
            iconColor="#0288D1"
            gradientColor="info"
          />
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
          <Tab label="Ledger" />
          <Tab label="Cash Book" />
          <Tab label="Reports" />
        </Tabs>

        {/* Transactions Tab */}
        <TabPanel value={tabValue} index={0}>
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
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      {formatDate(transaction.date, 'DD/MM/YYYY')}
                    </TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.entries?.[0]?.account_name || 'N/A'}</TableCell>
                    <TableCell
                      sx={{
                        color: transaction.type === 'revenue' ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(transaction.amount)}
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
                        onClick={() => handleDeleteTransaction(transaction.id)}
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

        {/* Accounts Tab */}
        <TabPanel value={tabValue} index={1}>
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
                  <TableRow key={account.id} hover>
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
                      {formatCurrency(account.balance)}
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
                        onClick={() => handleDeleteAccount(account.id)}
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

        {/* Ledger Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <DatePicker
                      label="Start Date"
                      value={dateRange[0]}
                      onChange={(newValue) => {
                        setDateRange([newValue, dateRange[1]]);
                      }}
                      slotProps={{
                        textField: { size: "small", fullWidth: true }
                      }}
                    />
                    <DatePicker
                      label="End Date"
                      value={dateRange[1]}
                      onChange={(newValue) => {
                        setDateRange([dateRange[0], newValue]);
                      }}
                      slotProps={{
                        textField: { size: "small", fullWidth: true }
                      }}
                    />
                  </Box>
                </LocalizationProvider>
              </Grid>
            </Grid>

            <TableContainer sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                    <TableCell align="right">Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.reference}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(entry.debit)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(entry.credit)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(entry.running_balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Cash Book Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <DatePicker
                      label="Start Date"
                      value={dateRange[0]}
                      onChange={(newValue) => {
                        setDateRange([newValue, dateRange[1]]);
                      }}
                      slotProps={{
                        textField: { size: "small", fullWidth: true }
                      }}
                    />
                    <DatePicker
                      label="End Date"
                      value={dateRange[1]}
                      onChange={(newValue) => {
                        setDateRange([dateRange[0], newValue]);
                      }}
                      slotProps={{
                        textField: { size: "small", fullWidth: true }
                      }}
                    />
                  </Box>
                </LocalizationProvider>
              </Grid>
            </Grid>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Receipts</TableCell>
                    <TableCell align="right">Payments</TableCell>
                    <TableCell align="right">Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{dateRange[0]?.format('YYYY-MM-DD')}</TableCell>
                    <TableCell>OB</TableCell>
                    <TableCell>Opening Balance</TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">${summary.openingBalance?.toFixed(2) || '0.00'}</TableCell>
                  </TableRow>
                  {transactions
                    .filter(t => t.account?.code === '1001')
                    .map((transaction) => (
                      <TableRow key={transaction.id} hover>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.reference}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell align="right">
                          {transaction.type === 'receipt' ? `$${Number(transaction.amount).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {transaction.type === 'payment' ? `$${Number(transaction.amount).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right">${Number(transaction.running_balance).toFixed(2)}</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Reports Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Trial Balance</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateReport('trial-balance')}
                    >
                      Generate
                    </Button>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    View the trial balance to ensure your books are balanced
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Balance Sheet</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateReport('balance-sheet')}
                    >
                      Generate
                    </Button>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    View your company's financial position at a glance
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Profit & Loss</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateReport('profit-loss')}
                    >
                      Generate
                    </Button>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Analyze your income and expenses over a period
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Cash Flow</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateReport('cash-flow')}
                    >
                      Generate
                    </Button>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Track your cash movements and liquidity position
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
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
                    <MenuItem value="revenue">Revenue</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="credit_payment">Credit Payment</MenuItem>
                    <MenuItem value="manufacturing_payment">Manufacturing Payment</MenuItem>
                    <MenuItem value="salary">Salary</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={transactionFormData.category}
                    label="Category"
                    onChange={handleTransactionInputChange}
                  >
                    {transactionFormData.type === 'revenue' && (
                      <MenuItem value="sales_income">Sales Income</MenuItem>
                    )}
                    {transactionFormData.type === 'expense' && (
                      <>
                        <MenuItem value="production_expense">Production Expense</MenuItem>
                        <MenuItem value="maintenance_expense">Maintenance Expense</MenuItem>
                        <MenuItem value="utility_expense">Utility Expense</MenuItem>
                        <MenuItem value="other_expense">Other Expense</MenuItem>
                      </>
                    )}
                    {transactionFormData.type === 'credit_payment' && (
                      <MenuItem value="credit_contribution">Company Credit Contribution</MenuItem>
                    )}
                    {transactionFormData.type === 'manufacturing_payment' && (
                      <>
                        <MenuItem value="manufacturing_cost">Manufacturing Cost</MenuItem>
                        <MenuItem value="raw_material_payment">Raw Material Payment</MenuItem>
                      </>
                    )}
                    {transactionFormData.type === 'salary' && (
                      <MenuItem value="salary_payment">Salary Payment</MenuItem>
                    )}
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
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
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
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={transactionFormData.paymentMethod}
                    label="Payment Method"
                    onChange={handleTransactionInputChange}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                  </Select>
                </FormControl>
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
              {transactionFormData.type === 'salary' && (
                <Grid item xs={12}>
                  <TextField
                    name="employee"
                    label="Employee Name/ID"
                    fullWidth
                    value={transactionFormData.employee}
                    onChange={handleTransactionInputChange}
                  />
                </Grid>
              )}
              {transactionFormData.type === 'manufacturing_payment' && (
                <Grid item xs={12}>
                  <TextField
                    name="manufacturingOrder"
                    label="Manufacturing Order Reference"
                    fullWidth
                    value={transactionFormData.manufacturingOrder}
                    onChange={handleTransactionInputChange}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTransactionDialog}>Cancel</Button>
            <Button onClick={handleTransactionSubmit} color="primary">
              {selectedTransaction ? 'Update' : 'Create'}
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

        <ReportDialog
          open={openReportDialog}
          onClose={() => setOpenReportDialog(false)}
          type={currentReport}
          data={reportData[currentReport]}
        />
      </Paper>
    </Box>
  );
};

export default Accounting;