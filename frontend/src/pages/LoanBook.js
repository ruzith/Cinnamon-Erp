import React, { useState, useEffect } from "react";
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
  InputAdornment,
  LinearProgress,
  Alert,
} from "@mui/material";
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
  AccountBalance as AccountBalanceIcon,
  Payments as PaymentsIcon,
  Warning as WarningIcon,
  Print as PrintIcon,
  Clear as ClearIcon,
  MonetizationOn as MonetizationOnIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useCurrencyFormatter } from "../utils/currencyUtils";
import SummaryCard from "../components/common/SummaryCard";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && children}
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
    overdueLoans: 0,
  });

  const [loanFormData, setLoanFormData] = useState({
    borrower_type: "employee",
    borrower_id: "",
    borrowerName: "",
    borrowerContact: "",
    amount: "",
    interestRate: "",
    term: "",
    startDate: "",
    endDate: "",
    purpose: "",
    collateral: "",
    status: "active",
    paymentFrequency: "monthly",
    notes: "",
  });

  const [paymentFormData, setPaymentFormData] = useState({
    loanId: "",
    amount: "",
    date: "",
    paymentMethod: "",
    reference: "",
    notes: "",
  });

  const [borrowers, setBorrowers] = useState([]);
  const [openPayrollDialog, setOpenPayrollDialog] = useState(false);
  const [payrollDetails, setPayrollDetails] = useState(null);
  const [employees, setEmployees] = useState([]);

  const [reportFilters, setReportFilters] = useState({
    borrowerName: "",
    startDate: "",
    endDate: "",
    paymentStatus: "",
  });
  const [reportData, setReportData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [allBorrowers, setAllBorrowers] = useState([]);

  const { formatCurrency } = useCurrencyFormatter();

  useEffect(() => {
    fetchLoans();
    fetchPayments();
    fetchSummary();
    fetchEmployees();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await axios.get("/api/loans");
      setLoans(response.data);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get("/api/loans/payments");
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get("/api/loans/summary");
      setSummary({
        totalLoaned: Number(response.data.totalLoaned) || 0,
        totalRepaid: Number(response.data.totalRepaid) || 0,
        outstandingAmount: Number(response.data.outstandingAmount) || 0,
        activeLoans: Number(response.data.activeLoans) || 0,
        overdueLoans: Number(response.data.overdueLoans) || 0,
      });
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary({
        totalLoaned: 0,
        totalRepaid: 0,
        outstandingAmount: 0,
        activeLoans: 0,
        overdueLoans: 0,
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAllBorrowers = () => {
    try {
      // Extract unique borrowers from loans data
      const uniqueBorrowers = Array.from(
        new Set(loans.map((loan) => loan.borrower_id))
      ).map((borrowerId) => {
        const loan = loans.find((l) => l.borrower_id === borrowerId);
        return {
          id: loan.borrower_id,
          name: loan.borrower_name,
          borrower_type: loan.borrower_type || "other",
        };
      });
      setAllBorrowers(uniqueBorrowers);
    } catch (error) {
      console.error("Error processing borrowers:", error);
      setAllBorrowers([]);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenLoanDialog = (loan = null) => {
    if (loan) {
      setSelectedLoan(loan);
      setLoanFormData({
        borrower_type: loan.borrower_type || "employee",
        borrower_id: loan.borrower_id,
        borrowerName: loan.borrower_name,
        borrowerContact: loan.borrower_contact || "",
        amount: loan.amount,
        interestRate: loan.interest_rate,
        term: loan.term_months,
        startDate: new Date(loan.created_at).toISOString().split("T")[0],
        endDate: loan.end_date
          ? new Date(loan.end_date).toISOString().split("T")[0]
          : "",
        status: loan.status,
        notes: loan.notes || "",
      });
    } else {
      setSelectedLoan(null);
      setLoanFormData({
        borrower_type: "employee",
        borrower_id: "",
        borrowerName: "",
        borrowerContact: "",
        amount: "",
        interestRate: "",
        term: "",
        startDate: "",
        endDate: "",
        status: "active",
        notes: "",
      });
    }
    setOpenLoanDialog(true);
  };

  const handleOpenPaymentDialog = (loan) => {
    setSelectedLoan(loan);
    setPaymentFormData({
      loanId: loan.id,
      amount: "",
      date: "",
      paymentMethod: "",
      reference: "",
      notes: "",
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
      let response;
      if (selectedLoan) {
        response = await axios.put(
          `/api/loans/${selectedLoan.id}`,
          loanFormData
        );
      } else {
        response = await axios.post("/api/loans", {
          ...loanFormData,
          createAccountingEntry: true,
          accountingData: {
            type: "credit_payment",
            category: "loan_disbursement",
            amount: loanFormData.amount,
            description: `Loan disbursement to ${
              loanFormData.borrowerName || "borrower"
            }`,
            reference: `LOAN-${Date.now()}`,
            status: "completed",
            notes: `Loan disbursement - ${
              loanFormData.purpose || "No purpose specified"
            }`,
          },
        });
      }
      fetchLoans();
      fetchSummary();
      handleCloseLoanDialog();
    } catch (error) {
      console.error("Error saving loan:", error);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        loan_id: selectedLoan.id,
        amount: paymentFormData.amount,
        payment_date: paymentFormData.date,
        reference:
          paymentFormData.reference ||
          `LP${Math.floor(Math.random() * 100000000)
            .toString()
            .padStart(8, "0")}`,
        status: "completed",
        notes: paymentFormData.notes,
        createAccountingEntry: true,
        accountingData: {
          type: "revenue",
          category: "loan_repayment",
          amount: paymentFormData.amount,
          description: `Loan repayment from ${selectedLoan?.borrower_name}`,
          reference: paymentFormData.reference || `LOAN-REPAY-${Date.now()}`,
          paymentMethod: paymentFormData.paymentMethod,
          status: "completed",
          notes: paymentFormData.notes,
        },
      };

      await axios.post("/api/loans/payments", paymentData);
      fetchLoans();
      fetchPayments();
      fetchSummary();
      handleClosePaymentDialog();
    } catch (error) {
      console.error("Error processing payment:", error);
    }
  };

  const handleDeleteLoan = async (loanId) => {
    if (window.confirm("Are you sure you want to delete this loan?")) {
      try {
        await axios.delete(`/api/loans/${loanId}`);
        fetchLoans();
        fetchSummary();
      } catch (error) {
        console.error("Error deleting loan:", error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "overdue":
        return "error";
      case "completed":
        return "info";
      case "defaulted":
        return "warning";
      default:
        return "default";
    }
  };

  const calculateRemainingAmount = (loan) => {
    return Number(loan.remaining_balance);
  };

  useEffect(() => {}, [loanFormData.borrower_type, openLoanDialog]);

  const handleViewPayroll = async (employeeId) => {
    try {
      const response = await axios.get(`/api/payroll/calculate/${employeeId}`);
      setPayrollDetails(response.data);
      setOpenPayrollDialog(true);
    } catch (error) {
      console.error("Error fetching payroll details:", error);
    }
  };

  const handleFilterChange = (field, value) => {
    setReportFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateReport = async () => {
    try {
      setReportError(null);

      // Filter loans based on the selected criteria
      let filteredLoans = [...loans];

      // Filter by borrower
      if (reportFilters.borrowerName) {
        filteredLoans = filteredLoans.filter(
          (loan) => loan.borrower_id === reportFilters.borrowerName
        );
      }

      // Filter by date range
      if (reportFilters.startDate) {
        filteredLoans = filteredLoans.filter(
          (loan) =>
            new Date(loan.created_at) >= new Date(reportFilters.startDate)
        );
      }
      if (reportFilters.endDate) {
        filteredLoans = filteredLoans.filter(
          (loan) => new Date(loan.created_at) <= new Date(reportFilters.endDate)
        );
      }

      // Filter by payment status
      if (reportFilters.paymentStatus) {
        filteredLoans = filteredLoans.filter((loan) => {
          const remainingBalance = Number(loan.remaining_balance);

          switch (reportFilters.paymentStatus) {
            case "paid":
              return remainingBalance <= 0;
            case "unpaid":
              return remainingBalance > 0 && loan.status !== "overdue";
            case "overdue":
              return loan.status === "overdue";
            default:
              return true;
          }
        });
      }

      // Enhance loan data with payment information
      const reportData = filteredLoans.map((loan) => {
        const loanPayments = payments.filter(
          (payment) => payment.loan_id === loan.id
        );
        const totalPaid = loanPayments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        );
        const remainingBalance = Number(loan.amount) - totalPaid;

        return {
          ...loan,
          totalPaid,
          remainingAmount: remainingBalance,
          payments: loanPayments,
          borrowerName: loan.borrower_name,
          borrowerContact: loan.borrower_contact || "N/A",
          borrower_type: loan.borrower_type || "N/A",
          interestRate: loan.interest_rate,
          term: loan.term_months,
        };
      });

      setReportData(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
      setReportError("Error generating report");
    }
  };

  useEffect(() => {
    if (tabValue === 2) {
      generateReport();
    }
  }, [reportFilters, tabValue]);

  const handleOpenReport = (loan) => {
    setSelectedReport(loan);
    setReportDialog(true);
  };

  const handleCloseReport = () => {
    setReportDialog(false);
    setSelectedReport(null);
  };

  const handlePrintReport = async (loan) => {
    try {
      const response = await axios.get(`/api/loans/${loan.id}/report`);

      // Create a new window and write the report HTML
      const reportWindow = window.open("", "_blank");
      reportWindow.document.write(response.data.reportHtml);
      reportWindow.document.close();

      // Print automatically
      reportWindow.onload = function () {
        reportWindow.print();
      };
    } catch (error) {
      console.error("Error printing loan report:", error);
      alert(error.response?.data?.message || "Error printing report");
    }
  };

  const ReportDialog = () => {
    const loanPayments = payments
      .filter((payment) => selectedReport?.id === payment.loan_id)
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    const totalPaid = loanPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const remainingBalance = selectedReport
      ? Number(selectedReport.amount) - totalPaid
      : 0;

    return (
      <Dialog
        open={reportDialog}
        onClose={handleCloseReport}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              Loan Report - {selectedReport?.loan_number}
            </Typography>
            <Chip
              label={selectedReport?.status}
              color={getStatusColor(selectedReport?.status)}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <SummaryCard
                    title="Total Amount"
                    value={formatCurrency(selectedReport.amount)}
                    icon={MonetizationOnIcon}
                    iconColor="primary.main"
                    gradientColor="primary"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SummaryCard
                    title="Total Paid"
                    value={formatCurrency(totalPaid)}
                    icon={PaymentIcon}
                    iconColor="success.main"
                    gradientColor="success"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SummaryCard
                    title="Remaining Balance"
                    value={formatCurrency(remainingBalance)}
                    icon={AccountBalanceIcon}
                    iconColor="warning.main"
                    gradientColor="warning"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SummaryCard
                    title="Interest Rate"
                    value={`${selectedReport.interest_rate}%`}
                    icon={AssessmentIcon}
                    iconColor="info.main"
                    gradientColor="info"
                  />
                </Grid>
              </Grid>

              {/* Loan Details */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Loan Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Borrower Details
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Name:</strong> {selectedReport.borrower_name}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Created By:</strong>{" "}
                        {selectedReport.created_by_name}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Created Date:</strong>{" "}
                        {new Date(
                          selectedReport.created_at
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Loan Terms
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Term Length:</strong>{" "}
                        {selectedReport.term_months} months
                      </Typography>
                      <Typography variant="body1">
                        <strong>Interest Rate:</strong>{" "}
                        {selectedReport.interest_rate}%
                      </Typography>
                      <Typography variant="body1">
                        <strong>Status:</strong> {selectedReport.status}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment History */}
              <Typography variant="h6" gutterBottom>
                Payment History
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell>Created By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loanPayments.length > 0 ? (
                      loanPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {new Date(
                              payment.payment_date
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell>
                            <Chip
                              label={payment.status}
                              color={
                                payment.status === "completed"
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{payment.notes}</TableCell>
                          <TableCell>{payment.created_by_name}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            No payment history available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReport}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  useEffect(() => {
    fetchAllBorrowers();
  }, [loans]);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
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
          <SummaryCard
            icon={BorrowersIcon}
            title="Total Active Loans"
            value={summary.activeLoans}
            iconColor="#D32F2F"
            gradientColor="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AccountBalanceIcon}
            title="Total Loan Amount"
            value={formatCurrency(summary.totalLoaned)}
            iconColor="#9C27B0"
            gradientColor="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={PaymentsIcon}
            title="Total Repaid"
            value={formatCurrency(summary.totalRepaid)}
            iconColor="#ED6C02"
            gradientColor="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={WarningIcon}
            title="Outstanding Balance"
            value={formatCurrency(summary.outstandingAmount)}
            iconColor="#0288D1"
            gradientColor="info"
          />
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
            pt: 2,
          }}
        >
          <Tab label="Active Loans" />
          <Tab label="Payment History" />
          <Tab label="Reports" />
        </Tabs>

        {/* Active Loans Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Loan Number</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Interest Rate</TableCell>
                  <TableCell>Term (Months)</TableCell>
                  <TableCell>Remaining Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{loan.loan_number}</TableCell>
                    <TableCell>{loan.borrower_name}</TableCell>
                    <TableCell>{formatCurrency(loan.amount)}</TableCell>
                    <TableCell>{loan.interest_rate}%</TableCell>
                    <TableCell>{loan.term_months}</TableCell>
                    <TableCell>
                      {formatCurrency(loan.remaining_balance)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={loan.status}
                        color={getStatusColor(loan.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(loan.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenPaymentDialog(loan)}
                        sx={{ color: "success.main" }}
                      >
                        <PaymentIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenHistoryDialog(loan)}
                        sx={{ color: "info.main", ml: 1 }}
                      >
                        <HistoryIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenLoanDialog(loan)}
                        sx={{ color: "primary.main", ml: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteLoan(loan.id)}
                        sx={{ color: "error.main", ml: 1 }}
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

        {/* Payment History Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Loan Number</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Created By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{payment.loan_number}</TableCell>
                      <TableCell>{payment.borrower_name}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.reference}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          color={
                            payment.status === "completed"
                              ? "success"
                              : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{payment.notes}</TableCell>
                      <TableCell>{payment.created_by_name}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No payment records available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Reports Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box>
            {/* Filters Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Borrower Name</InputLabel>
                    <Select
                      value={reportFilters.borrowerName}
                      label="Borrower Name"
                      onChange={(e) =>
                        handleFilterChange("borrowerName", e.target.value)
                      }
                      endAdornment={
                        reportFilters.borrowerName && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() =>
                              handleFilterChange("borrowerName", "")
                            }
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>All Borrowers</em>
                      </MenuItem>
                      {loans
                        .filter(
                          (loan, index, self) =>
                            index ===
                            self.findIndex(
                              (l) => l.borrower_id === loan.borrower_id
                            )
                        )
                        .map((loan) => (
                          <MenuItem
                            key={loan.borrower_id}
                            value={loan.borrower_id}
                          >
                            {loan.borrower_name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={reportFilters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: reportFilters.startDate && (
                        <IconButton
                          size="small"
                          onClick={() => handleFilterChange("startDate", "")}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={reportFilters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: reportFilters.endDate && (
                        <IconButton
                          size="small"
                          onClick={() => handleFilterChange("endDate", "")}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                      inputProps: {
                        min: reportFilters.startDate || undefined,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                      value={reportFilters.paymentStatus}
                      label="Payment Status"
                      onChange={(e) =>
                        handleFilterChange("paymentStatus", e.target.value)
                      }
                      endAdornment={
                        reportFilters.paymentStatus && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() =>
                              handleFilterChange("paymentStatus", "")
                            }
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="unpaid">Unpaid</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {reportError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {reportError}
              </Alert>
            )}

            {/* Reports Grid */}
            <Grid container spacing={3}>
              {reportData.map((loan) => {
                const loanPayments = payments.filter(
                  (payment) => payment.loan_id === loan.id
                );
                const totalPaid = loanPayments.reduce(
                  (sum, payment) => sum + Number(payment.amount),
                  0
                );
                const remainingBalance = Number(loan.amount) - totalPaid;

                return (
                  <Grid item xs={12} md={6} lg={4} key={loan.id}>
                    <Paper
                      sx={{
                        p: 2,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                      onClick={() => handleOpenReport(loan)}
                    >
                      <Box
                        sx={{
                          mb: 2,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {loan.borrower_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {loan.loan_number}
                          </Typography>
                        </Box>
                        <Chip
                          label={loan.status}
                          color={getStatusColor(loan.status)}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Total Amount
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "medium" }}
                          >
                            {formatCurrency(loan.amount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Interest Rate
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "medium" }}
                          >
                            {loan.interest_rate}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Total Paid
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "medium", color: "success.main" }}
                          >
                            {formatCurrency(totalPaid)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Remaining
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: "medium",
                              color:
                                remainingBalance > 0
                                  ? "warning.main"
                                  : "success.main",
                            }}
                          >
                            {formatCurrency(remainingBalance)}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: "auto", pt: 2 }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<AssessmentIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReport(loan);
                          }}
                        >
                          View Report
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Loan Dialog */}
      <Dialog
        open={openLoanDialog}
        onClose={handleCloseLoanDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedLoan ? "Edit Loan" : "New Loan"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Borrower Type</InputLabel>
                <Select
                  name="borrower_type"
                  value={loanFormData.borrower_type}
                  label="Borrower Type"
                  onChange={handleLoanInputChange}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="contractor">Contractor</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              {loanFormData.borrower_type === "employee" && (
                <FormControl fullWidth>
                  <InputLabel>Select Employee</InputLabel>
                  <Select
                    name="borrower_id"
                    value={loanFormData.borrower_id}
                    label="Select Employee"
                    onChange={handleLoanInputChange}
                    required
                  >
                    <MenuItem value="">Select Employee</MenuItem>
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.nic}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
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
            {selectedLoan ? "Update Loan" : "Create Loan"}
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
                Remaining Amount:{" "}
                {formatCurrency(
                  selectedLoan ? calculateRemainingAmount(selectedLoan) : 0
                )}
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
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="paymentMethod"
                  value={paymentFormData.paymentMethod}
                  label="Payment Method"
                  onChange={handlePaymentInputChange}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                </Select>
              </FormControl>
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
        <DialogTitle>
          Payment History - {selectedLoan?.borrower_name}
        </DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Loan Number
                  </Typography>
                  <Typography variant="body1">
                    {selectedLoan.loan_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(selectedLoan.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Remaining Balance
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(selectedLoan.remaining_balance)}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Payment Records
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments
                      .filter((payment) => payment.loan_id === selectedLoan.id)
                      .sort(
                        (a, b) =>
                          new Date(b.payment_date) - new Date(a.payment_date)
                      )
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {new Date(
                              payment.payment_date
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell>
                            <Chip
                              label={payment.status}
                              color={
                                payment.status === "completed"
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{payment.notes}</TableCell>
                        </TableRow>
                      ))}
                    {!payments.filter(
                      (payment) => payment.loan_id === selectedLoan.id
                    ).length && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            No payments recorded for this loan
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPayrollDialog}
        onClose={() => setOpenPayrollDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Employee Payroll Details</DialogTitle>
        <DialogContent>
          {payrollDetails && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">
                  {payrollDetails.employeeName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Basic Salary</Typography>
                <Typography variant="h6">
                  ${payrollDetails.basicSalary.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Gross Salary</Typography>
                <Typography variant="h6">
                  ${payrollDetails.grossSalary.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Earnings</Typography>
                {payrollDetails.earnings.map((earning, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography>{earning.name}</Typography>
                    <Typography>${earning.amount.toFixed(2)}</Typography>
                  </Box>
                ))}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Deductions</Typography>
                {payrollDetails.deductions.map((deduction, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography>{deduction.name}</Typography>
                    <Typography>${deduction.amount.toFixed(2)}</Typography>
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Net Salary</Typography>
                <Typography variant="h5" color="primary">
                  ${payrollDetails.netSalary.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayrollDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <ReportDialog />
    </Box>
  );
};

export default LoanBook;
