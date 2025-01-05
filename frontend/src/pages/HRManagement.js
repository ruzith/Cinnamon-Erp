import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as SalaryIcon,
  AccountBalance as AdvanceIcon,
  Receipt as PayrollIcon,
  Clear as ClearIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import axios from '../app/axios';
import { format } from 'date-fns';
import SummaryCard from '../components/common/SummaryCard';
import { useCurrencyFormatter, formatCurrencyStatic } from '../utils/currencyUtils';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hr-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function HRManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [openAdvanceDialog, setOpenAdvanceDialog] = useState(false);
  const [openPayrollDialog, setOpenPayrollDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [payrollMonth, setPayrollMonth] = useState('');
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [reportFilters, setReportFilters] = useState({
    employeeId: '',
    startDate: null,
    endDate: null,
  });
  const [reportData, setReportData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const { formatCurrency } = useCurrencyFormatter();

  useEffect(() => {
    fetchEmployees();
    fetchAdvances();
    fetchPayrolls();
  }, []);

  useEffect(() => {
    if (tabValue === 2) {
      generateReport();
    }
  }, [reportFilters, tabValue]);

  const handleFilterChange = (field, value) => {
    setReportFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data.filter(emp => emp.employment_type === 'permanent'));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAdvances = async () => {
    try {
      const response = await axios.get('/api/hr/salary-advances');
      setAdvances(response.data);
    } catch (error) {
      console.error('Error fetching advances:', error);
    }
  };

  const fetchPayrolls = async () => {
    try {
      const response = await axios.get('/api/hr/payroll');
      setPayrolls(response.data);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    }
  };

  const handleAdvanceSubmit = async () => {
    try {
      await axios.post('/api/hr/salary-advances', {
        employee_id: selectedEmployee,
        amount: parseFloat(advanceAmount),
        request_date: new Date().toISOString().split('T')[0],
      });
      setOpenAdvanceDialog(false);
      fetchAdvances();
    } catch (error) {
      console.error('Error submitting advance:', error);
    }
  };

  const handlePayrollSubmit = async () => {
    try {
      const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);
      const advances = await axios.get(`/api/hr/salary-advances/employee/${selectedEmployee}`);
      const pendingAdvances = advances.data.filter(adv => adv.approval_status === 'approved');

      const totalAdvances = pendingAdvances.reduce((sum, adv) => sum + parseFloat(adv.amount), 0);

      const payrollData = {
        employee_id: selectedEmployee,
        month: parseInt(payrollMonth),
        year: parseInt(payrollYear),
        basic_salary: parseFloat(selectedEmployeeData.basic_salary),
        deductions: totalAdvances,
        net_salary: parseFloat(selectedEmployeeData.basic_salary) - totalAdvances,
        created_by: user.id,
      };

      await axios.post('/api/hr/payroll', payrollData);
      setOpenPayrollDialog(false);
      fetchPayrolls();
    } catch (error) {
      console.error('Error submitting payroll:', error);
    }
  };

  const handleAdvanceAction = async (id, action) => {
    try {
      await axios.put(`/api/hr/salary-advances/${id}/${action}`);
      fetchAdvances();
    } catch (error) {
      console.error('Error updating advance:', error);
    }
  };

  const handlePrintPayroll = async (payroll) => {
    try {
      const settingsResponse = await axios.get('/api/settings');
      const settings = settingsResponse.data;

      // Parse numeric values
      const basicSalary = parseFloat(payroll.basic_salary) || 0;
      const deductions = parseFloat(payroll.deductions) || 0;
      const netSalary = parseFloat(payroll.net_salary) || 0;
      const monthName = format(new Date(2000, payroll.month - 1), 'MMMM');

      // Create a printable view
      const printContent = `
        <html>
          <head>
            <title>Payroll Slip - ${payroll.employee_name}</title>
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 20mm;
                }
              }
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
                color: #333;
                line-height: 1.6;
              }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 100px;
                opacity: 0.05;
                z-index: -1;
                color: #000;
                white-space: nowrap;
              }
              .company-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 2px solid #333;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                margin: 0;
                color: #1976d2;
              }
              .company-details {
                font-size: 14px;
                color: #666;
                margin: 5px 0;
              }
              .document-title {
                font-size: 20px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                color: #333;
                text-transform: uppercase;
              }
              .slip-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                padding: 15px;
                background-color: #f5f5f5;
                border-radius: 5px;
              }
              .employee-info, .payroll-period {
                flex: 1;
              }
              .info-label {
                font-weight: bold;
                color: #666;
                font-size: 12px;
                text-transform: uppercase;
              }
              .info-value {
                font-size: 14px;
                margin-bottom: 10px;
              }
              .payroll-details {
                margin: 20px 0;
                border: 1px solid #ddd;
                border-radius: 5px;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 20px;
                border-bottom: 1px solid #eee;
              }
              .detail-row:last-child {
                border-bottom: none;
              }
              .detail-label {
                font-weight: bold;
                color: #333;
              }
              .amount {
                font-family: monospace;
                font-size: 14px;
              }
              .total-section {
                margin-top: 20px;
                padding: 15px 20px;
                background-color: #1976d2;
                color: white;
                border-radius: 5px;
              }
              .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
              .signature-section {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
              }
              .signature-box {
                flex: 1;
                max-width: 200px;
                text-align: center;
              }
              .signature-line {
                border-top: 1px solid #333;
                margin-top: 50px;
                margin-bottom: 10px;
              }
              .company-registration {
                font-size: 12px;
                color: #666;
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <div class="watermark">PAYROLL SLIP</div>
            <div class="company-header">
              <h1 class="company-name">${settings.company_name}</h1>
              <p class="company-details">${settings.company_address}</p>
              <p class="company-details">Phone: ${settings.company_phone}</p>
              <p class="company-registration">VAT No: ${settings.vat_number} | Tax No: ${settings.tax_number}</p>
            </div>

            <div class="document-title">Payroll Slip</div>

            <div class="slip-header">
              <div class="employee-info">
                <div class="info-label">Employee Name</div>
                <div class="info-value">${payroll.employee_name}</div>
                <div class="info-label">Employee ID</div>
                <div class="info-value">${payroll.employee_id}</div>
              </div>
              <div class="payroll-period">
                <div class="info-label">Pay Period</div>
                <div class="info-value">${monthName} ${payroll.year}</div>
                <div class="info-label">Payment Date</div>
                <div class="info-value">${format(new Date(), 'dd MMM yyyy')}</div>
              </div>
            </div>

            <div class="payroll-details">
              <div class="detail-row">
                <span class="detail-label">Basic Salary</span>
                <span class="amount">${formatCurrencyStatic(basicSalary, false)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Deductions (Salary Advances)</span>
                <span class="amount">-${formatCurrencyStatic(deductions, false)}</span>
              </div>
            </div>

            <div class="total-section detail-row">
              <span class="detail-label">Net Salary</span>
              <span class="amount">${formatCurrencyStatic(netSalary, false)}</span>
            </div>

            <div class="footer">
              <p>Generated on ${format(new Date(), 'dd MMM yyyy, HH:mm')} IST</p>
              <p>For any queries, please contact HR Department</p>
              <p>${settings.company_name} | ${settings.company_phone}</p>
            </div>
          </body>
        </html>
      `;

      // Create a new window and print
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Error printing payroll:', error);
    }
  };

  const generateReport = async () => {
    try {
      setReportError(null);

      // Fetch comprehensive employee report data
      const response = await axios.get('/api/hr/reports/employee', {
        params: {
          employeeId: reportFilters.employeeId,
          startDate: reportFilters.startDate || null,
          endDate: reportFilters.endDate || null,
        },
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportError(error.response?.data?.message || 'Error generating report');
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalAdvances: advances.length,
    approvedAdvances: advances.filter(adv => adv.approval_status === 'approved').length,
    pendingAdvances: advances.filter(adv => adv.approval_status === 'pending').length,
    totalPayrolls: payrolls.length,
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const handlePrintReport = async (employee) => {
    try {
      const settingsResponse = await axios.get('/api/settings');
      const settings = settingsResponse.data;

      const printContent = `
        <html>
          <head>
            <title>Employee Report - ${employee.name}</title>
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 20mm;
                }
              }
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
                color: #333;
                line-height: 1.6;
              }
              .company-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 2px solid #333;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                margin: 0;
                color: #1976d2;
              }
              .company-details {
                font-size: 14px;
                color: #666;
                margin: 5px 0;
              }
              .document-title {
                font-size: 20px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                color: #333;
                text-transform: uppercase;
              }
              .section {
                margin: 20px 0;
                padding: 15px;
                background-color: #f5f5f5;
                border-radius: 5px;
              }
              .section-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #1976d2;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
              }
              .info-item {
                margin-bottom: 10px;
              }
              .info-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
              }
              .info-value {
                font-size: 14px;
                font-weight: 500;
              }
              .activity-list {
                list-style: none;
                padding: 0;
                margin: 0;
              }
              .activity-item {
                padding: 10px 0;
                border-bottom: 1px solid #eee;
              }
              .activity-item:last-child {
                border-bottom: none;
              }
              .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="company-header">
              <h1 class="company-name">${settings.company_name}</h1>
              <p class="company-details">${settings.company_address}</p>
              <p class="company-details">Phone: ${settings.company_phone}</p>
            </div>

            <div class="document-title">Employee HR Report</div>

            <div class="section">
              <div class="section-title">Employee Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Name</div>
                  <div class="info-value">${employee.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Designation</div>
                  <div class="info-value">${employee.designation || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Department</div>
                  <div class="info-value">${employee.department || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Employment Type</div>
                  <div class="info-value">${employee.employment_type || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Work Summary</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Total Working Hours</div>
                  <div class="info-value">${employee.summary.totalHours} hrs</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Basic Salary</div>
                  <div class="info-value">${formatCurrencyStatic(employee.basic_salary, false)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Total Salary Advances</div>
                  <div class="info-value">${formatCurrencyStatic(employee.summary.totalAdvances, false)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Net Salary</div>
                  <div class="info-value">${formatCurrencyStatic(employee.summary.netSalary, false)}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Recent Activity</div>
              <ul class="activity-list">
                ${employee.recentActivity?.map(activity => `
                  <li class="activity-item">
                    <div class="info-value">${activity.description}</div>
                    <div class="info-label">${format(new Date(activity.date), 'dd MMM yyyy')}</div>
                  </li>
                `).join('') || 'No recent activity'}
              </ul>
            </div>

            <div class="footer">
              <p>Generated on ${format(new Date(), 'dd MMM yyyy, HH:mm')} IST</p>
              <p>For any queries, please contact HR Department</p>
              <p>${settings.company_name} | ${settings.company_phone}</p>
            </div>
          </body>
        </html>
      `;

      // Create a new window and print
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Error printing report:', error);
    }
  };

  const handleOpenReport = (employee) => {
    setSelectedReport(employee);
    setReportDialog(true);
  };

  const handleCloseReport = () => {
    setReportDialog(false);
    setSelectedReport(null);
  };

  const ReportDialog = () => (
    <Dialog
      open={reportDialog}
      onClose={handleCloseReport}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Employee Report - {selectedReport?.name}
      </DialogTitle>
      <DialogContent>
        {selectedReport && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Working Hours"
                  value={`${selectedReport.total_hours} hrs`}
                  icon={TimelineIcon}
                  iconColor="primary.main"
                  gradientColor="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Salary Advances"
                  value={`${selectedReport.advance_count} (${formatCurrency(selectedReport.total_advances)})`}
                  icon={AdvanceIcon}
                  iconColor="warning.main"
                  gradientColor="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Net Salary"
                  value={formatCurrency(selectedReport.net_salary, false)}
                  icon={SalaryIcon}
                  iconColor="success.main"
                  gradientColor="success"
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 2 }}>Employee Details</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Personal Information</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>NIC:</strong> {selectedReport.nic}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {selectedReport.phone}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Address:</strong> {selectedReport.address}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Birthday:</strong> {format(new Date(selectedReport.birthday), 'dd MMM yyyy')}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Employment Details</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Type:</strong> {selectedReport.employment_type}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Status:</strong> {selectedReport.status}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Basic Salary:</strong> {formatCurrency(selectedReport.basic_salary, false)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Salary Type:</strong> {selectedReport.salary_type}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 2 }}>Bank Details</Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Bank Name:</strong> {selectedReport.bank_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Account Name:</strong> {selectedReport.account_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Account Number:</strong> {selectedReport.account_number}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedReport.recentActivity?.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(activity.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{activity.type}</TableCell>
                      <TableCell>{formatCurrency(activity.amount, false)}</TableCell>
                      <TableCell>
                        <Chip
                          label={activity.approval_status}
                          color={getStatusColor(activity.approval_status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
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

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          HR Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAdvanceDialog(true)}
          >
            New Salary Advance
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AdvanceIcon}
            title="Total Advances"
            value={summaryStats.totalAdvances}
            iconColor="#1976d2"
            gradientColor="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={CheckCircleIcon}
            title="Approved Advances"
            value={summaryStats.approvedAdvances}
            iconColor="#2e7d32"
            gradientColor="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AssessmentIcon}
            title="Pending Advances"
            value={summaryStats.pendingAdvances}
            iconColor="#ed6c02"
            gradientColor="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={PayrollIcon}
            title="Total Payrolls"
            value={summaryStats.totalPayrolls}
            iconColor="#0288d1"
            gradientColor="info"
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab label="Salary Advances" />
          <Tab label="Payroll" />
          <Tab label="Reports" />
        </Tabs>

        {/* Salary Advances Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Request Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {advances.map((advance) => (
                  <TableRow key={advance.id} hover>
                    <TableCell>{advance.employee_name}</TableCell>
                    <TableCell>{formatCurrency(advance.amount, false)}</TableCell>
                    <TableCell>{format(new Date(advance.request_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <Chip
                        label={advance.approval_status}
                        color={getStatusColor(advance.approval_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {advance.approval_status === 'pending' && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleAdvanceAction(advance.id, 'approve')}
                            sx={{ color: 'success.main' }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleAdvanceAction(advance.id, 'reject')}
                            sx={{ color: 'error.main', ml: 1 }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Payroll Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Month/Year</TableCell>
                  <TableCell>Basic Salary</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payrolls.map((payroll) => (
                  <TableRow key={payroll.id} hover>
                    <TableCell>{payroll.employee_name}</TableCell>
                    <TableCell>{`${payroll.month}/${payroll.year}`}</TableCell>
                    <TableCell>{formatCurrency(payroll.basic_salary, false)}</TableCell>
                    <TableCell>{formatCurrency(payroll.deductions, false)}</TableCell>
                    <TableCell>{formatCurrency(payroll.net_salary, false)}</TableCell>
                    <TableCell>
                      <Chip
                        label={payroll.status}
                        color={getStatusColor(payroll.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handlePrintPayroll(payroll)}
                        sx={{ color: 'success.main' }}
                      >
                        <PrintIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
                <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={reportFilters.employeeId}
                      label="Employee"
                      onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                      endAdornment={
                        reportFilters.employeeId && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() => handleFilterChange('employeeId', '')}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>All Employees</em>
                      </MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                  label="Start Date"
                    type="date"
                    value={reportFilters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: reportFilters.startDate && (
                        <IconButton
                          size="small"
                          onClick={() => handleFilterChange('startDate', '')}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )
                    }}
                  />
            </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                  label="End Date"
                    type="date"
                    value={reportFilters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: reportFilters.endDate && (
                        <IconButton
                          size="small"
                          onClick={() => handleFilterChange('endDate', '')}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                      inputProps: {
                        min: reportFilters.startDate || undefined
                      }
                    }}
                  />
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
              {reportData.map((employee) => (
                <Grid item xs={12} md={6} lg={4} key={employee.id}>
                  <Paper
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => handleOpenReport(employee)}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {employee.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {employee.designation || 'No Designation'} • {employee.department || 'No Department'}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Working Hours
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={`${employee.summary.totalHours} hrs`}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Salary Advances
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={formatCurrency(employee.summary.totalAdvances)}
                            color="warning"
                            size="small"
                          />
                        </Box>
                      </Grid>
            </Grid>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Salary Details
                      </Typography>
                      <Typography variant="body2">
                        Basic: {formatCurrency(employee.basic_salary, false)} • Net: {formatCurrency(employee.summary.netSalary, false)}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 'auto', pt: 2 }}>
              <Button
                        variant="outlined"
                fullWidth
                        startIcon={<AssessmentIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReport(employee);
                        }}
                      >
                        View Report
              </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Salary Advance Dialog */}
      <Dialog open={openAdvanceDialog} onClose={() => setOpenAdvanceDialog(false)}>
        <DialogTitle>New Salary Advance</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Employee</InputLabel>
            <Select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={advanceAmount}
            onChange={(e) => setAdvanceAmount(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdvanceDialog(false)}>Cancel</Button>
          <Button onClick={handleAdvanceSubmit} variant="contained" color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payroll Dialog */}
      <Dialog open={openPayrollDialog} onClose={() => setOpenPayrollDialog(false)}>
        <DialogTitle>Generate Payroll</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Employee</InputLabel>
            <Select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <MenuItem key={month} value={month}>
                  {format(new Date(2000, month - 1), 'MMMM')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Year"
            type="number"
            value={payrollYear}
            onChange={(e) => setPayrollYear(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayrollDialog(false)}>Cancel</Button>
          <Button onClick={handlePayrollSubmit} variant="contained" color="primary">
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      <ReportDialog />
    </Box>
  );
}