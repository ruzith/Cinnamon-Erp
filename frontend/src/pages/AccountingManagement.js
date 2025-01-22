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
  Alert,
} from "@mui/material";
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
  CheckCircleOutline as CheckCircleOutlineIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  TrendingDown,
  RestartAlt as RestartAltIcon,
  AccountBalance,
} from "@mui/icons-material";
import axios from "axios";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { formatCurrency } from "../utils/currencyUtils";
import { formatDate } from "../utils/dateUtils";
import { useCurrencyFormatter } from "../utils/currencyUtils";
import SummaryCard from "../components/common/SummaryCard";
import { useDispatch } from "react-redux";
import { postTransaction, updateTransaction } from "../features/accounting/accountingSlice";
import { useSnackbar } from "notistack";
import accountingService from "../features/accounting/accountingService";

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

const transactionCategories = {
  revenue: [{ value: "sales_income", label: "Sales Income" }],
  expense: [
    { value: "production_expense", label: "Production Expense" },
    { value: "maintenance_expense", label: "Maintenance Expense" },
    { value: "utility_expense", label: "Utility Expense" },
    { value: "other_expense", label: "Other Expense" },
  ],
  credit_payment: [
    { value: "credit_contribution", label: "Company Credit Contribution" },
  ],
  manufacturing_payment: [
    { value: "manufacturing_cost", label: "Manufacturing Cost" },
    { value: "raw_material_payment", label: "Raw Material Payment" },
  ],
  salary: [{ value: "salary_payment", label: "Salary Payment" }],
};

const accountCategories = {
  asset: [
    { value: "cash_and_equivalents", label: "Cash & Equivalents" },
    { value: "accounts_receivable", label: "Accounts Receivable" },
    { value: "inventory", label: "Inventory" },
    { value: "fixed_assets", label: "Fixed Assets" },
    { value: "other_assets", label: "Other Assets" },
  ],
  liability: [
    { value: "accounts_payable", label: "Accounts Payable" },
    { value: "loans_payable", label: "Loans Payable" },
    { value: "accrued_expenses", label: "Accrued Expenses" },
    { value: "other_liabilities", label: "Other Liabilities" },
  ],
  equity: [
    { value: "capital_stock", label: "Capital Stock" },
    { value: "retained_earnings", label: "Retained Earnings" },
    { value: "other_equity", label: "Other Equity" },
  ],
  revenue: [
    { value: "sales_revenue", label: "Sales Revenue" },
    { value: "service_revenue", label: "Service Revenue" },
    { value: "other_revenue", label: "Other Revenue" },
  ],
  expense: [
    { value: "cost_of_goods_sold", label: "Cost of Goods Sold" },
    { value: "operating_expenses", label: "Operating Expenses" },
    { value: "payroll_expenses", label: "Payroll Expenses" },
    { value: "manufacturing_expenses", label: "Manufacturing Expenses" },
    { value: "administrative_expenses", label: "Administrative Expenses" },
    { value: "other_expenses", label: "Other Expenses" },
  ],
};

const getTransactionTypeColor = (type) => {
  switch (type) {
    case "revenue":
      return "success";
    case "expense":
    case "salary":
      return "error";
    case "asset":
      return "primary";
    case "liability":
      return "warning";
    case "manufacturing_payment":
      return "info";
    default:
      return "default";
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'default';  // grey color
    case 'posted':
      return 'primary';  // blue color
    case 'draft':
      return 'warning';  // orange/yellow color
    case 'cancelled':
      return 'error';    // red color
    case 'pending':
      return 'info';     // light blue color
    default:
      return 'default';
  }
};

const getAccountTypeColor = (type) => {
  switch (type) {
    case "asset":
      return "primary";
    case "liability":
      return "error";
    case "equity":
      return "success";
    case "revenue":
      return "info";
    case "expense":
      return "warning";
    default:
      return "default";
  }
};

const TransactionDetailsDialog = ({ open, onClose, transaction }) => {
  const { formatCurrency } = useCurrencyFormatter();

  if (!transaction) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Transaction Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Reference
            </Typography>
            <Typography variant="body1" gutterBottom>
              {transaction.reference}
            </Typography>

            <Typography variant="subtitle2" color="textSecondary">
              Date
            </Typography>
            <Typography variant="body1" gutterBottom>
              {dayjs(transaction.date).format("DD/MM/YYYY")}
            </Typography>

            <Typography variant="subtitle2" color="textSecondary">
              Type
            </Typography>
            <Chip
              label={transaction.type.replace("_", " ")}
              size="small"
              color={getTransactionTypeColor(transaction.type)}
              sx={{ my: 1 }}
            />

            <Typography variant="subtitle2" color="textSecondary">
              Status
            </Typography>
            <Chip
              label={transaction.status}
              size="small"
              color={getStatusColor(transaction.status)}
              sx={{ my: 1 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Amount
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatCurrency(transaction.amount)}
            </Typography>

            <Typography variant="subtitle2" color="textSecondary">
              Created By
            </Typography>
            <Typography variant="body1" gutterBottom>
              {transaction.created_by_name}
            </Typography>

            <Typography variant="subtitle2" color="textSecondary">
              Created At
            </Typography>
            <Typography variant="body1" gutterBottom>
              {dayjs(transaction.created_at).format("DD/MM/YYYY HH:mm")}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">
              Description
            </Typography>
            <Typography variant="body1" gutterBottom>
              {transaction.description}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Entries
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transaction.entries?.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.account_name}</TableCell>
                      <TableCell align="right" sx={{ color: "error.main" }}>
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "success.main" }}>
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
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
      fixedAssets: 0,
    },
    liabilities: {
      total: 0,
      currentLiabilities: 0,
      longTermLiabilities: 0,
    },
    equity: {
      total: 0,
    },
    profitLoss: {
      revenue: 0,
      expenses: 0,
      netProfit: 0,
    },
    ratios: {
      currentRatio: 0,
      debtToEquity: 0,
      quickRatio: 0,
    },
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
  });

  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [transactionFormData, setTransactionFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    category: transactionCategories["expense"]?.[0]?.value || "",
    amount: "",
    description: "",
    account: "",
    reference: "",
    notes: "",
    status: "draft",
  });

  const [accountFormData, setAccountFormData] = useState({
    code: "",
    name: "",
    type: "asset",
    category: "",
    balance: "",
    status: "active",
    description: "",
  });

  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const [reportData, setReportData] = useState({
    trialBalance: null,
    profitLoss: null,
    balanceSheet: null,
    cashFlow: null,
  });

  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  const { formatCurrency } = useCurrencyFormatter();

  const validTypes = [
    "revenue",
    "expense",
    "credit_payment",
    "manufacturing_payment",
    "salary",
  ];
  const validCategories = [
    "sales_income",
    "production_expense",
    "maintenance_expense",
    "royalty_payment",
    "lease_payment",
    "salary_payment",
    "credit_contribution",
    "manufacturing_cost",
    "raw_material_payment",
    "utility_expense",
    "other_expense",
  ];

  const [manufacturingOrders, setManufacturingOrders] = useState([]);
  const [employees, setEmployees] = useState([]);

  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedTransactionDetails, setSelectedTransactionDetails] =
    useState(null);

  const [cashbookEntries, setCashbookEntries] = useState({
    openingBalance: 0,
    entries: [],
    totalReceipts: 0,
    totalPayments: 0,
    closingBalance: 0,
  });

  const [cashAccount, setCashAccount] = useState(null);

  const fetchCashAccount = async () => {
    try {
      const response = await axios.get("/api/accounting/accounts?code=1001");
      if (response.data && response.data.length > 0) {
        setCashAccount(response.data[0]);
      } else {
        enqueueSnackbar(
          "Cash account not found. Please check account configuration.",
          { variant: "error" }
        );
      }
    } catch (error) {
      console.error("Error fetching cash account:", error);
      enqueueSnackbar("Error fetching cash account", { variant: "error" });
    }
  };

  const fetchCashbook = async () => {
    try {
      const response = await accountingService.getCashbook(
        dateRange[0].format("YYYY-MM-DD"),
        dateRange[1].format("YYYY-MM-DD")
      );

      setCashbookEntries({
        openingBalance: Number(response.openingBalance) || 0,
        entries: Array.isArray(response.entries) ? response.entries : [],
        totalReceipts: Number(response.totalReceipts) || 0,
        totalPayments: Number(response.totalPayments) || 0,
        closingBalance: Number(response.closingBalance) || 0,
      });
    } catch (error) {
      console.error("Error fetching cashbook:", error);
      enqueueSnackbar("Error fetching cashbook data", { variant: "error" });
      setCashbookEntries({
        openingBalance: 0,
        entries: [],
        totalReceipts: 0,
        totalPayments: 0,
        closingBalance: 0,
      });
    }
  };

  useEffect(() => {
    if (tabValue === 3 && dateRange[0] && dateRange[1]) {
      fetchCashbook();
    }
  }, [tabValue, dateRange, enqueueSnackbar]);

  const fetchManufacturingOrders = async () => {
    try {
      const response = await axios.get("/api/manufacturing/orders");
      setManufacturingOrders(response.data);
    } catch (error) {
      console.error("Error fetching manufacturing orders:", error);
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

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchSummary();
    fetchManufacturingOrders();
    fetchEmployees();
    fetchCashAccount();
  }, []);

  useEffect(() => {
    if (selectedAccount && dateRange[0] && dateRange[1]) {
      fetchLedgerEntries();
    }
  }, [selectedAccount, dateRange]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get("/api/accounting/transactions");
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get("/api/accounting/accounts");
      setAccounts(response.data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get("/api/accounting/summary");
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchLedgerEntries = async () => {
    try {
      const response = await axios.get(
        `/api/accounting/ledger/${selectedAccount}`,
        {
          params: {
            startDate: dateRange[0].format("YYYY-MM-DD"),
            endDate: dateRange[1].format("YYYY-MM-DD"),
          },
        }
      );
      setLedgerEntries(response.data);
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenTransactionDialog = (transaction = null) => {
    if (transaction) {
      setSelectedTransaction(transaction);
      setTransactionFormData({
        date:
          transaction.date?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        type: transaction.type || "expense",
        category:
          transaction.category || transactionCategories["expense"]?.[0]?.value,
        amount: transaction.amount || "",
        description: transaction.description || "",
        account: transaction.account_id || "",
        reference: transaction.reference || "",
        status: transaction.status || "draft",
        paymentMethod: transaction.payment_method || "",
        notes: transaction.notes || "",
        employee: transaction.employee_id || "",
        manufacturingOrder: transaction.reference_details || "",
      });
    } else {
      setSelectedTransaction(null);
      setTransactionFormData({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        category: transactionCategories["expense"]?.[0]?.value || "",
        amount: "",
        description: "",
        account: "",
        reference: "",
        status: "draft",
        paymentMethod: "",
        notes: "",
        employee: "",
        manufacturingOrder: "",
      });
    }
    setOpenTransactionDialog(true);
  };

  const fetchTransactionAccount = async (accountId) => {
    try {
      const response = await axios.get(`/api/accounting/accounts/${accountId}`);
      setTransactionFormData((prev) => ({
        ...prev,
        account: response.data.id,
      }));
    } catch (error) {
      console.error("Error fetching account details:", error);
    }
  };

  const handleOpenAccountDialog = (account = null) => {
    if (account) {
      setSelectedAccount(account);
      setAccountFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
        balance: account.balance,
        status: account.status,
        description: account.description,
      });
    } else {
      setSelectedAccount(null);
      setAccountFormData({
        code: "",
        name: "",
        type: "asset",
        category: accountCategories["asset"]?.[0]?.value || "",
        balance: "",
        status: "active",
        description: "",
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
    const { name, value } = e.target;

    if (name === "type") {
      setTransactionFormData((prev) => ({
        ...prev,
        [name]: value,
        category: transactionCategories[value]?.[0]?.value || "",
      }));
    } else {
      setTransactionFormData((prev) => ({
        ...prev,
        [name]: name === "amount" ? Number(value) : value,
      }));
    }
  };

  const handleAccountInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "type") {
      setAccountFormData((prev) => ({
        ...prev,
        [name]: value,
        category: accountCategories[value]?.[0]?.value || "",
      }));
    } else {
      setAccountFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();

    const { date, type, category, amount, account, paymentMethod } =
      transactionFormData;
    if (!date || !type || !category || !amount || !account || !paymentMethod) {
      enqueueSnackbar(
        "Please fill in all required fields: Date, Type, Category, Amount, Account, and Payment Method.",
        { variant: "warning" }
      );
      return;
    }

    if (!cashAccount) {
      enqueueSnackbar(
        "Cash account not configured. Please contact administrator.",
        { variant: "error" }
      );
      return;
    }

    // Prepare entries based on transaction type
    let entries = [];
    if (
      type === "expense" ||
      type === "manufacturing_payment" ||
      type === "salary"
    ) {
      entries = [
        {
          account_id: account, // Expense account
          description: transactionFormData.description,
          debit: amount,
          credit: 0,
        },
        {
          account_id: cashAccount.id, // Use the actual cash account ID
          description: transactionFormData.description,
          debit: 0,
          credit: amount,
        },
      ];
    } else if (type === "revenue" || type === "credit_payment") {
      entries = [
        {
          account_id: cashAccount.id, // Use the actual cash account ID
          description: transactionFormData.description,
          debit: amount,
          credit: 0,
        },
        {
          account_id: account, // Revenue account
          description: transactionFormData.description,
          debit: 0,
          credit: amount,
        },
      ];
    }

    try {
      const payload = {
        ...transactionFormData,
        entries,
        status: transactionFormData.status || "draft",
      };

      if (selectedTransaction) {
        await axios.put(
          `/api/accounting/transactions/${selectedTransaction.id}`,
          payload
        );
      } else {
        await axios.post("/api/accounting/transactions", payload);
      }

      fetchTransactions();
      fetchSummary();
      handleCloseTransactionDialog();
      enqueueSnackbar("Transaction saved successfully", { variant: "success" });
    } catch (error) {
      console.error("Error saving transaction:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error saving transaction",
        { variant: "error" }
      );
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();

    const { code, name, type, category } = accountFormData;
    if (!code || !name || !type || !category) {
      alert("Please fill in all required fields: Code, Name, Type, Category.");
      return;
    }

    try {
      if (selectedAccount) {
        await axios.put(
          `/api/accounting/accounts/${selectedAccount.id}`,
          accountFormData
        );
        enqueueSnackbar('Account updated successfully', { variant: 'success' });
      } else {
        await axios.post("/api/accounting/accounts", accountFormData);
        enqueueSnackbar('Account created successfully', { variant: 'success' });
      }
      fetchAccounts();
      handleCloseAccountDialog();
    } catch (error) {
      console.error("Error saving account:", error);
      enqueueSnackbar(error.response?.data?.message || 'Error saving account', { variant: 'error' });
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await axios.delete(`/api/accounting/transactions/${transactionId}`);
        fetchTransactions();
        fetchSummary();
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      if (window.confirm("Are you sure you want to delete this account?")) {
        await axios.delete(`/api/accounting/accounts/${accountId}`);
        fetchAccounts();
        enqueueSnackbar('Account deleted successfully', { variant: 'success' });
      }
    } catch (error) {
      // Check if it's the specific error about existing transactions
      if (error.response?.data?.message?.includes('existing transactions')) {
        // Ask user if they want to deactivate instead
        if (window.confirm('This account has existing transactions and cannot be deleted. Would you like to deactivate it instead?')) {
          try {
            // First get the current account data
            const [account] = accounts.filter(acc => acc.id === accountId);
            if (!account) {
              throw new Error('Account not found');
            }

            // Update only the status while preserving other fields
            await axios.put(`/api/accounting/accounts/${accountId}`, {
              ...account,
              status: 'inactive'
            });

            fetchAccounts();
            enqueueSnackbar('Account deactivated successfully', { variant: 'success' });
          } catch (updateError) {
            console.error('Error deactivating account:', updateError);
            enqueueSnackbar(updateError.response?.data?.message || 'Error deactivating account', { variant: 'error' });
          }
        }
      } else {
        console.error('Error deleting account:', error);
        enqueueSnackbar(error.response?.data?.message || 'Error deleting account', { variant: 'error' });
      }
    }
  };

  const handleGenerateReport = async (reportType) => {
    try {
      const response = await accountingService.getReport(
        reportType,
        dateRange[0].format("YYYY-MM-DD"),
        dateRange[1].format("YYYY-MM-DD")
      );

      setReportData((prev) => ({
        ...prev,
        [reportType]: response,
      }));

      setCurrentReport(reportType);
      setOpenReportDialog(true);
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      enqueueSnackbar(`Error generating ${reportType} report`, {
        variant: "error",
      });
    }
  };

  const handleExportReport = async (type, data) => {
    try {
      const response = await axios.post(
        `/api/accounting/reports/${type}/export`,
        {
          data,
          format: "excel",
          dateRange: {
            startDate: dateRange[0].format("YYYY-MM-DD"),
            endDate: dateRange[1].format("YYYY-MM-DD"),
          },
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${type}-report-${dayjs().format("YYYY-MM-DD")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error exporting ${type} report:`, error);
    }
  };

  const ReportDialog = ({ open, onClose, type, data }) => {
    if (!open || !data) return null;

    const renderReportContent = () => {
      switch (type) {
        case "trial-balance":
          return (
            <Box>
              <Typography variant="h6" gutterBottom>
                Trial Balance
              </Typography>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                {`Period: ${dateRange[0].format(
                  "DD/MM/YYYY"
                )} - ${dateRange[1].format("DD/MM/YYYY")}`}
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
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
                        <TableCell align="right" sx={{ color: "error.main" }}>
                          {account.debit > 0
                            ? formatCurrency(account.debit)
                            : "-"}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "success.main" }}>
                          {account.credit > 0
                            ? formatCurrency(account.credit)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow
                      sx={{
                        bgcolor: "action.hover",
                        "& td": { fontWeight: "bold" },
                      }}
                    >
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell align="right" sx={{ color: "error.main" }}>
                        {formatCurrency(data.totalDebit || 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "success.main" }}>
                        {formatCurrency(data.totalCredit || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {!data.isBalanced && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="error">
                    Trial balance is not balanced! The difference is{" "}
                    {formatCurrency(
                      Math.abs((data.totalDebit || 0) - (data.totalCredit || 0))
                    )}
                  </Alert>
                </Box>
              )}
            </Box>
          );

        case "balance-sheet":
          return (
            <Box>
              <Typography variant="h6" gutterBottom>
                Balance Sheet
              </Typography>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                {`As of ${dateRange[1].format("DD/MM/YYYY")}`}
              </Typography>

              {/* Assets Section */}
              <Typography
                variant="h6"
                sx={{ mt: 3, mb: 1, color: "primary.main" }}
              >
                Assets
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Account</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.assets?.current?.map((asset, index) => (
                      <TableRow key={index}>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(Math.abs(asset.balance))}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow
                      sx={{
                        bgcolor: "action.hover",
                        "& td": { fontWeight: "bold" },
                      }}
                    >
                      <TableCell>Total Assets</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Math.abs(data?.assets?.total || 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Liabilities Section */}
              <Typography
                variant="h6"
                sx={{ mt: 3, mb: 1, color: "error.main" }}
              >
                Liabilities
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Account</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.liabilities?.current?.map((liability, index) => (
                      <TableRow key={index}>
                        <TableCell>{liability.name}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(Math.abs(liability.balance))}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow
                      sx={{
                        bgcolor: "action.hover",
                        "& td": { fontWeight: "bold" },
                      }}
                    >
                      <TableCell>Total Liabilities</TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          Math.abs(data?.liabilities?.total || 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Net Position</span>
                  <span>
                    {formatCurrency(
                      Math.abs(
                        (data?.assets?.total || 0) -
                          (data?.liabilities?.total || 0)
                      )
                    )}
                  </span>
                </Typography>
              </Box>
            </Box>
          );

        case "profit-loss":
          return (
            <Box>
              <Typography variant="h6" gutterBottom>
                Profit & Loss Statement
              </Typography>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                {`Period: ${dateRange[0].format(
                  "DD/MM/YYYY"
                )} - ${dateRange[1].format("DD/MM/YYYY")}`}
              </Typography>

              {/* Revenue Section */}
              <Typography
                variant="h6"
                sx={{ mt: 3, mb: 1, color: "success.main" }}
              >
                Revenue
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Account</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.revenue?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell align="right" sx={{ color: "success.main" }}>
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow
                      sx={{
                        bgcolor: "action.hover",
                        "& td": { fontWeight: "bold" },
                      }}
                    >
                      <TableCell colSpan={2}>Total Revenue</TableCell>
                      <TableCell align="right" sx={{ color: "success.main" }}>
                        {formatCurrency(data.totalRevenue || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Expenses Section */}
              <Typography
                variant="h6"
                sx={{ mt: 3, mb: 1, color: "error.main" }}
              >
                Expenses
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Account</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.expenses?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell align="right" sx={{ color: "error.main" }}>
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow
                      sx={{
                        bgcolor: "action.hover",
                        "& td": { fontWeight: "bold" },
                      }}
                    >
                      <TableCell colSpan={2}>Total Expenses</TableCell>
                      <TableCell align="right" sx={{ color: "error.main" }}>
                        {formatCurrency(data.totalExpenses || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Net {data.netIncome >= 0 ? "Income" : "Loss"}</span>
                  <span
                    style={{
                      color: data.netIncome >= 0 ? "#2e7d32" : "#d32f2f",
                    }}
                  >
                    {formatCurrency(Math.abs(data.netIncome || 0))}
                  </span>
                </Typography>
              </Box>
            </Box>
          );

        case "cash-flow":
          return (
            <Box>
              <Typography variant="h6" gutterBottom>
                Cash Flow Statement
              </Typography>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                {`Period: ${dateRange[0].format(
                  "DD/MM/YYYY"
                )} - ${dateRange[1].format("DD/MM/YYYY")}`}
              </Typography>

              <Box
                sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}
              >
                <Typography variant="subtitle1">
                  Opening Balance: {formatCurrency(data.openingBalance || 0)}
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Cash Movements
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Inflow</TableCell>
                      <TableCell align="right">Outflow</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.operating?.inflows?.map((item, index) => (
                      <TableRow key={`inflow-${index}`}>
                        <TableCell>
                          {dayjs(item.date).format("DD/MM/YYYY")}
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right" sx={{ color: "success.main" }}>
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell align="right">-</TableCell>
                      </TableRow>
                    ))}
                    {data.operating?.outflows?.map((item, index) => (
                      <TableRow key={`outflow-${index}`}>
                        <TableCell>
                          {dayjs(item.date).format("DD/MM/YYYY")}
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right" sx={{ color: "error.main" }}>
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow
                      sx={{
                        bgcolor: "action.hover",
                        "& td": { fontWeight: "bold" },
                      }}
                    >
                      <TableCell colSpan={2}>Net Cash Movement</TableCell>
                      <TableCell
                        colSpan={2}
                        align="right"
                        sx={{
                          color:
                            data.operating?.total >= 0
                              ? "success.main"
                              : "error.main",
                        }}
                      >
                        {formatCurrency(data.operating?.total || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <span>Net Cash Flow</span>
                  <span
                    style={{
                      color: data.netCashFlow >= 0 ? "#2e7d32" : "#d32f2f",
                    }}
                  >
                    {formatCurrency(data.netCashFlow || 0)}
                  </span>
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Closing Balance</span>
                  <span>{formatCurrency(data.closingBalance || 0)}</span>
                </Typography>
              </Box>
            </Box>
          );

        default:
          return <Typography>Report type not supported</Typography>;
      }
    };

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {type
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}{" "}
          Report
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>{renderReportContent()}</Box>
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
    activeAccounts: accounts.filter((acc) => acc.status === "active").length,
    totalTransactions: transactions.length,
    totalBalance: accounts.reduce((sum, acc) => sum + Number(acc.balance), 0),
  };

  const handlePostTransaction = async (transactionId) => {
    try {
      await dispatch(postTransaction(transactionId)).unwrap();
      fetchTransactions();
      enqueueSnackbar("Transaction posted successfully", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error posting transaction:", error);
      enqueueSnackbar(error.message || "Error posting transaction", {
        variant: "error",
      });
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransactionDetails(transaction);
    setOpenDetailsDialog(true);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Accounting Management
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
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

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AccountBalanceIcon}
            title="Total Revenue"
            value={formatCurrency(summary.currentMonthRevenue || 0)}
            subtitle="Current Month"
            iconColor="#2E7D32"
            gradientColor="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={PaymentsIcon}
            title="Total Expenses"
            value={formatCurrency(summary.currentMonthExpenses || 0)}
            subtitle="Current Month"
            iconColor="#D32F2F"
            gradientColor="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={TrendingUp}
            title="Net Income"
            value={formatCurrency(summary.currentMonthNetIncome || 0)}
            subtitle="Current Month"
            iconColor={summary.currentMonthNetIncome >= 0 ? "#2E7D32" : "#D32F2F"}
            gradientColor={summary.currentMonthNetIncome >= 0 ? "success" : "error"}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AccountBalanceWallet}
            title="Cash Balance"
            value={formatCurrency(summary.cashBalance || 0)}
            subtitle="Current Balance"
            iconColor="#0288D1"
            gradientColor="info"
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 2 }}
        >
          <Tab label="Transactions" />
          <Tab label="Accounts" />
          <Tab label="Ledger" />
          <Tab label="Cash Book" />
          <Tab label="Reports" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Accounts</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      {dayjs(transaction.date).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell>{transaction.reference}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type.replace("_", " ")}
                        size="small"
                        color={getTransactionTypeColor(transaction.type)}
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>
                      <Box>
                        {transaction.entries?.map((entry, index) => (
                          <Typography
                            key={index}
                            variant="body2"
                            color={entry.debit > 0 ? "error" : "success"}
                          >
                            {entry.account_name}
                            {entry.debit > 0
                              ? ` (Dr ${formatCurrency(entry.debit)})`
                              : ` (Cr ${formatCurrency(entry.credit)})`}
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        size="small"
                        color={getStatusColor(transaction.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        {transaction.status === "draft" && (
                          <Button
                            color="success"
                            onClick={() =>
                              handlePostTransaction(transaction.id)
                            }
                          >
                            Post
                          </Button>
                        )}
                        <IconButton
                          onClick={() => handleViewTransaction(transaction)}
                          sx={{ color: "info.main" }}
                          title="View Details"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {transaction.status === "draft" && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeleteTransaction(transaction.id)
                            }
                            title="Delete Transaction"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
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
                        color:
                          account.balance >= 0 ? "success.main" : "error.main",
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <IconButton
                          onClick={() => handleOpenAccountDialog(account)}
                          sx={{ color: "primary.main" }}
                          title="Edit Account"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteAccount(account.id)}
                          sx={{ color: "error.main" }}
                          title="Delete Account"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={selectedAccount || ""}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    endAdornment={
                      selectedAccount && (
                        <IconButton
                          size="small"
                          sx={{ mr: 2 }}
                          onClick={() => setSelectedAccount("")}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )
                    }
                  >
                    <MenuItem value="">
                      <em>Select Account</em>
                    </MenuItem>
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={dateRange[0]?.format("YYYY-MM-DD") || ""}
                  onChange={(e) =>
                    setDateRange([
                      e.target.value
                        ? dayjs(e.target.value)
                        : dayjs().startOf("month"),
                      dateRange[1],
                    ])
                  }
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: dateRange[0] && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          setDateRange([dayjs().startOf("month"), dateRange[1]])
                        }
                        title="Reset to start of month"
                      >
                        <RestartAltIcon fontSize="small" />
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={dateRange[1]?.format("YYYY-MM-DD") || ""}
                  onChange={(e) =>
                    setDateRange([
                      dateRange[0],
                      e.target.value
                        ? dayjs(e.target.value)
                        : dayjs().endOf("month"),
                    ])
                  }
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: dateRange[1] && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          setDateRange([dateRange[0], dayjs().endOf("month")])
                        }
                        title="Reset to end of month"
                      >
                        <RestartAltIcon fontSize="small" />
                      </IconButton>
                    ),
                    inputProps: {
                      min: dateRange[0]?.format("YYYY-MM-DD") || undefined,
                    },
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
                  <TableCell>Reference</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!selectedAccount ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        Please select an account to view ledger entries
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : ledgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        No ledger entries found for the selected period
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerEntries.map((entry, index) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        {dayjs(entry.date).format("DD/MM/YYYY")}
                      </TableCell>
                      <TableCell>{entry.reference}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: entry.debit > 0 ? "error.main" : "inherit",
                        }}
                      >
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: entry.credit > 0 ? "success.main" : "inherit",
                        }}
                      >
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            entry.running_balance >= 0
                              ? "success.main"
                              : "error.main",
                        }}
                      >
                        {formatCurrency(entry.running_balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={dateRange[0]?.format("YYYY-MM-DD") || ""}
                  onChange={(e) =>
                    setDateRange([
                      e.target.value
                        ? dayjs(e.target.value)
                        : dayjs().startOf("month"),
                      dateRange[1],
                    ])
                  }
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: dateRange[0] && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          setDateRange([dayjs().startOf("month"), dateRange[1]])
                        }
                        title="Reset to start of month"
                      >
                        <RestartAltIcon fontSize="small" />
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={dateRange[1]?.format("YYYY-MM-DD") || ""}
                  onChange={(e) =>
                    setDateRange([
                      dateRange[0],
                      e.target.value
                        ? dayjs(e.target.value)
                        : dayjs().endOf("month"),
                    ])
                  }
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: dateRange[1] && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          setDateRange([dateRange[0], dayjs().endOf("month")])
                        }
                        title="Reset to end of month"
                      >
                        <RestartAltIcon fontSize="small" />
                      </IconButton>
                    ),
                    inputProps: {
                      min: dateRange[0]?.format("YYYY-MM-DD") || undefined,
                    },
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
                  <TableCell>Reference</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Receipts</TableCell>
                  <TableCell align="right">Payments</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cashbookEntries.entries?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        No entries found for the selected period
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow hover>
                      <TableCell>{dateRange[0].format("YYYY-MM-DD")}</TableCell>
                      <TableCell>OB</TableCell>
                      <TableCell>Opening Balance</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">
                        {formatCurrency(cashbookEntries.openingBalance || 0)}
                      </TableCell>
                    </TableRow>
                    {cashbookEntries.entries?.map((entry) => (
                      <TableRow key={entry.id} hover>
                        <TableCell>
                          {dayjs(entry.date).format("YYYY-MM-DD")}
                        </TableCell>
                        <TableCell>{entry.reference}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell align="right" sx={{ color: "success.main" }}>
                          {entry.receipt > 0
                            ? formatCurrency(entry.receipt)
                            : "-"}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "error.main" }}>
                          {entry.payment > 0
                            ? formatCurrency(entry.payment)
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(entry.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow hover>
                      <TableCell colSpan={3}>
                        <strong>Closing Balance</strong>
                      </TableCell>
                      <TableCell align="right" sx={{ color: "success.main" }}>
                        <strong>
                          {formatCurrency(cashbookEntries.totalReceipts || 0)}
                        </strong>
                      </TableCell>
                      <TableCell align="right" sx={{ color: "error.main" }}>
                        <strong>
                          {formatCurrency(cashbookEntries.totalPayments || 0)}
                        </strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          {formatCurrency(cashbookEntries.closingBalance || 0)}
                        </strong>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Trial Balance</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateReport("trial-balance")}
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
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Balance Sheet</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateReport("balance-sheet")}
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
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Profit & Loss</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateReport("profit-loss")}
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
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Cash Flow</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateReport("cash-flow")}
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

        <Dialog
          open={openTransactionDialog}
          onClose={handleCloseTransactionDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedTransaction ? "Edit Transaction" : "New Transaction"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  name="date"
                  label="Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={transactionFormData.date}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
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
                    <MenuItem value="manufacturing_payment">
                      Manufacturing Payment
                    </MenuItem>
                    <MenuItem value="salary">Salary</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={transactionFormData.category}
                    label="Category"
                    onChange={handleTransactionInputChange}
                  >
                    {transactionCategories[transactionFormData.type]?.map(
                      (category) => (
                        <MenuItem key={category.value} value={category.value}>
                          {category.label}
                        </MenuItem>
                      )
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
                  required
                  value={transactionFormData.amount}
                  onChange={handleTransactionInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Account</InputLabel>
                  <Select
                    name="account"
                    value={transactionFormData.account || ""}
                    label="Account"
                    onChange={handleTransactionInputChange}
                  >
                    <MenuItem value="">Select Account</MenuItem>
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={transactionFormData.paymentMethod || ""}
                    label="Payment Method"
                    onChange={handleTransactionInputChange}
                  >
                    <MenuItem value="">Select Payment Method</MenuItem>
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
              {transactionFormData.type === "salary" && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Employee</InputLabel>
                    <Select
                      name="employee"
                      value={transactionFormData.employee}
                      label="Employee"
                      onChange={handleTransactionInputChange}
                    >
                      {employees
                        .filter((employee) => employee.status === "active")
                        .map((employee) => (
                          <MenuItem key={employee.id} value={employee.id}>
                            {`${employee.name} - ${employee.designation_title} (${employee.department})`}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {transactionFormData.type === "manufacturing_payment" && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Manufacturing Order</InputLabel>
                    <Select
                      name="reference"
                      value={transactionFormData.reference}
                      label="Manufacturing Order"
                      onChange={handleTransactionInputChange}
                    >
                      {manufacturingOrders
                        .filter((order) => order.payment_status === "pending")
                        .map((order) => (
                          <MenuItem key={order.id} value={order.order_number}>
                            {`${order.order_number} - ${order.product_name} (${order.quantity} units) - ${order.status}`}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTransactionDialog}>Cancel</Button>
            <Button onClick={handleTransactionSubmit} color="primary">
              {selectedTransaction ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openAccountDialog}
          onClose={handleCloseAccountDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedAccount ? "Edit Account" : "New Account"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  name="code"
                  label="Account Code"
                  fullWidth
                  value={accountFormData.code}
                  onChange={handleAccountInputChange}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="name"
                  label="Account Name"
                  fullWidth
                  value={accountFormData.name}
                  onChange={handleAccountInputChange}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
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
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={accountFormData.category}
                    label="Category"
                    onChange={handleAccountInputChange}
                  >
                    {accountCategories[accountFormData.type]?.map(
                      (category) => (
                        <MenuItem key={category.value} value={category.value}>
                          {category.label}
                        </MenuItem>
                      )
                    )}
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
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAccountDialog}>Cancel</Button>
            <Button onClick={handleAccountSubmit} color="primary">
              {selectedAccount ? "Update Account" : "Create Account"}
            </Button>
          </DialogActions>
        </Dialog>

        <ReportDialog
          open={openReportDialog}
          onClose={() => setOpenReportDialog(false)}
          type={currentReport}
          data={reportData[currentReport]}
        />

        <TransactionDetailsDialog
          open={openDetailsDialog}
          onClose={() => setOpenDetailsDialog(false)}
          transaction={selectedTransactionDetails}
        />
      </Paper>
    </Box>
  );
};

export default Accounting;
