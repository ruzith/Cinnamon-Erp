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
  Payment as PaymentIcon,
  History as HistoryIcon,
  AccountBalance as LoanIcon,
  Payments as RepaymentIcon,
  Warning as AlertIcon,
  Groups as BorrowersIcon,
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

const LoanBook = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [summary, setSummary] = useState({
    totalLoaned: 0,
    totalRepaid: 0,
    outstandingAmount: 0,
    activeLoans: 0,
    overdueLoans: 0
  });

  const [loanFormData, setLoanFormData] = useState({
    borrowerName: '',
    borrowerContact: '',
    amount: '',
    interestRate: '',
    term: '',
    startDate: '',
    endDate: '',
    purpose: '',
    collateral: '',
    status: 'active',
    paymentFrequency: 'monthly',
    notes: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    loanId: '',
    amount: '',
    date: '',
    paymentMethod: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchLoans();
    fetchPayments();
    fetchSummary();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await axios.get('/api/loans');
      setLoans(response.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get('/api/loans/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/loans/summary');
      setSummary({
        totalLoaned: Number(response.data.totalLoaned) || 0,
        totalRepaid: Number(response.data.totalRepaid) || 0,
        outstandingAmount: Number(response.data.outstandingAmount) || 0,
        activeLoans: Number(response.data.activeLoans) || 0,
        overdueLoans: Number(response.data.overdueLoans) || 0
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummary({
        totalLoaned: 0,
        totalRepaid: 0,
        outstandingAmount: 0,
        activeLoans: 0,
        overdueLoans: 0
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenLoanDialog = (loan = null) => {
    if (loan) {
      setSelectedLoan(loan);
      setLoanFormData({
        borrowerName: loan.borrowerName,
        borrowerContact: loan.borrowerContact,
        amount: loan.amount,
        interestRate: loan.interestRate,
        term: loan.term,
        startDate: loan.startDate?.split('T')[0] || '',
        endDate: loan.endDate?.split('T')[0] || '',
        purpose: loan.purpose,
        collateral: loan.collateral,
        status: loan.status,
        paymentFrequency: loan.paymentFrequency,
        notes: loan.notes
      });
    } else {
      setSelectedLoan(null);
      setLoanFormData({
        borrowerName: '',
        borrowerContact: '',
        amount: '',
        interestRate: '',
        term: '',
        startDate: '',
        endDate: '',
        purpose: '',
        collateral: '',
        status: 'active',
        paymentFrequency: 'monthly',
        notes: ''
      });
    }
    setOpenLoanDialog(true);
  };

  const handleOpenPaymentDialog = (loan) => {
    setSelectedLoan(loan);
    setPaymentFormData({
      loanId: loan._id,
      amount: '',
      date: '',
      paymentMethod: '',
      reference: '',
      notes: ''
    });
    setOpenPaymentDialog(true);
  };

  const handleOpenHistoryDialog = (loan) => {
    setSelectedLoan(loan);
    setOpenHistoryDialog(true);
  };

  const handleCloseLoanDialog = () => {
    setOpenLoanDialog(false);
    setSelectedLoan(null);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedLoan(null);
  };

  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false);
    setSelectedLoan(null);
  };

  const handleLoanInputChange = (e) => {
    setLoanFormData({
      ...loanFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePaymentInputChange = (e) => {
    setPaymentFormData({
      ...paymentFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedLoan) {
        await axios.put(`/api/loans/${selectedLoan._id}`, loanFormData);
      } else {
        await axios.post('/api/loans', loanFormData);
      }
      fetchLoans();
      fetchSummary();
      handleCloseLoanDialog();
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/loans/payments', paymentFormData);
      fetchLoans();
      fetchPayments();
      fetchSummary();
      handleClosePaymentDialog();
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const handleDeleteLoan = async (loanId) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      try {
        await axios.delete(`/api/loans/${loanId}`);
        fetchLoans();
        fetchSummary();
      } catch (error) {
        console.error('Error deleting loan:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'overdue':
        return 'error';
      case 'completed':
        return 'info';
      case 'defaulted':
        return 'warning';
      default:
        return 'default';
    }
  };

  const calculateRemainingAmount = (loan) => {
    const paidAmount = payments
      .filter(payment => payment.loanId === loan._id)
      .reduce((sum, payment) => sum + payment.amount, 0);
    return loan.amount - paidAmount;
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Loan Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenLoanDialog()}
        >
          New Loan
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
              <LoanIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="textSecondary">Total Loaned</Typography>
            </Box>
            <Typography variant="h4">
              ${summary.totalLoaned.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
              <RepaymentIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography color="textSecondary">Total Repaid</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'success.main' }}>
              ${summary.totalRepaid.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
              <AlertIcon sx={{ color: 'error.main', mr: 1 }} />
              <Typography color="textSecondary">Outstanding Amount</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'error.main' }}>
              ${summary.outstandingAmount.toFixed(2)}
            </Typography>
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
              <BorrowersIcon sx={{ color: 'secondary.main', mr: 1 }} />
              <Typography color="textSecondary">Active Loans</Typography>
            </Box>
            <Typography variant="h4">
              {summary.activeLoans}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper 
        elevation={0} 
        sx={{ 
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            px: 2,
            pt: 2
          }}
        >
          <Tab label="Active Loans" />
          <Tab label="Payment History" />
        </Tabs>

        {/* Active Loans Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Remaining</TableCell>
                  <TableCell>Interest Rate</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan._id}>
                    <TableCell>{loan.borrowerName}</TableCell>
                    <TableCell>${loan.amount}</TableCell>
                    <TableCell>${calculateRemainingAmount(loan)}</TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>{new Date(loan.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={loan.status}
                        color={getStatusColor(loan.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenPaymentDialog(loan)}>
                        <PaymentIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenHistoryDialog(loan)}>
                        <HistoryIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenLoanDialog(loan)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteLoan(loan._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Payment History Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.loanId?.borrowerName}</TableCell>
                    <TableCell>${payment.amount}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{payment.reference}</TableCell>
                    <TableCell>{payment.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Loan Dialog */}
      <Dialog 
        open={openLoanDialog} 
        onClose={handleCloseLoanDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedLoan ? 'Edit Loan' : 'New Loan'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                name="borrowerName"
                label="Borrower Name"
                fullWidth
                value={loanFormData.borrowerName}
                onChange={handleLoanInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="borrowerContact"
                label="Contact Information"
                fullWidth
                value={loanFormData.borrowerContact}
                onChange={handleLoanInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="amount"
                label="Loan Amount"
                type="number"
                fullWidth
                value={loanFormData.amount}
                onChange={handleLoanInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="interestRate"
                label="Interest Rate (%)"
                type="number"
                fullWidth
                value={loanFormData.interestRate}
                onChange={handleLoanInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="term"
                label="Loan Term (months)"
                type="number"
                fullWidth
                value={loanFormData.term}
                onChange={handleLoanInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Frequency</InputLabel>
                <Select
                  name="paymentFrequency"
                  value={loanFormData.paymentFrequency}
                  label="Payment Frequency"
                  onChange={handleLoanInputChange}
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="annually">Annually</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="startDate"
                label="Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={loanFormData.startDate}
                onChange={handleLoanInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="endDate"
                label="End Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={loanFormData.endDate}
                onChange={handleLoanInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="purpose"
                label="Loan Purpose"
                fullWidth
                multiline
                rows={2}
                value={loanFormData.purpose}
                onChange={handleLoanInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="collateral"
                label="Collateral Details"
                fullWidth
                multiline
                rows={2}
                value={loanFormData.collateral}
                onChange={handleLoanInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={loanFormData.status}
                  label="Status"
                  onChange={handleLoanInputChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="defaulted">Defaulted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Additional Notes"
                fullWidth
                multiline
                rows={2}
                value={loanFormData.notes}
                onChange={handleLoanInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLoanDialog}>Cancel</Button>
          <Button onClick={handleLoanSubmit} color="primary">
            {selectedLoan ? 'Update Loan' : 'Create Loan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog 
        open={openPaymentDialog} 
        onClose={handleClosePaymentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1">
                Borrower: {selectedLoan?.borrowerName}
              </Typography>
              <Typography variant="subtitle2">
                Remaining Amount: ${selectedLoan ? calculateRemainingAmount(selectedLoan) : 0}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="amount"
                label="Payment Amount"
                type="number"
                fullWidth
                value={paymentFormData.amount}
                onChange={handlePaymentInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="date"
                label="Payment Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={paymentFormData.date}
                onChange={handlePaymentInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="paymentMethod"
                label="Payment Method"
                fullWidth
                value={paymentFormData.paymentMethod}
                onChange={handlePaymentInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="reference"
                label="Reference Number"
                fullWidth
                value={paymentFormData.reference}
                onChange={handlePaymentInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={paymentFormData.notes}
                onChange={handlePaymentInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button onClick={handlePaymentSubmit} color="primary">
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={openHistoryDialog}
        onClose={handleCloseHistoryDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Payment History</DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Borrower: {selectedLoan.borrowerName}
                </Typography>
                <Typography variant="subtitle2">
                  Loan Amount: ${selectedLoan.amount}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Reference</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments
                        .filter(payment => payment.loanId === selectedLoan._id)
                        .map((payment) => (
                          <TableRow key={payment._id}>
                            <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                            <TableCell>${payment.amount}</TableCell>
                            <TableCell>{payment.paymentMethod}</TableCell>
                            <TableCell>{payment.reference}</TableCell>
                            <TableCell>{payment.notes}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoanBook; 