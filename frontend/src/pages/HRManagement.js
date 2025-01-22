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
  Delete as DeleteIcon,
  ThumbUp as ApproveIcon,
} from '@mui/icons-material';
import axios from '../app/axios';
import { format } from 'date-fns';
import SummaryCard from '../components/common/SummaryCard';
import { useCurrencyFormatter, formatCurrencyStatic } from '../utils/currencyUtils';
import { useSnackbar } from 'notistack';

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

const PayrollForm = ({ onSubmit, onClose, onSuccess }) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [additionalAmounts, setAdditionalAmounts] = useState([]);
  const [deductionItems, setDeductionItems] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddAdditional = () => {
    setAdditionalAmounts([
      ...additionalAmounts,
      { description: '', amount: 0 }
    ]);
  };

  const handleAddDeduction = () => {
    setDeductionItems([
      ...deductionItems,
      { description: '', amount: 0 }
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await onSubmit({
            employee_id: selectedEmployee,
            month: parseInt(month),
            year: parseInt(year),
            additional_amounts: additionalAmounts.map(item => ({
                description: item.description,
                amount: parseFloat(item.amount)
            })),
            deduction_items: deductionItems.map(item => ({
                description: item.description,
                amount: parseFloat(item.amount)
            }))
        });
        if (onSuccess) {
            await onSuccess();
        }
        onClose();
    } catch (error) {
        // Handle the error gracefully
        if (error.response && error.response.status === 400) {
            alert(error.response.data.message); // Display the error message from the server
        } else {
            alert('An unexpected error occurred. Please try again.'); // Fallback error message
        }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Employee</InputLabel>
            <Select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              label="Employee"
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6}>
          <FormControl fullWidth required>
            <InputLabel>Month</InputLabel>
            <Select value={month} onChange={(e) => setMonth(e.target.value)} label="Month">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <MenuItem key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            required
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            inputProps={{ min: 2000, max: 2100 }}
          />
        </Grid>

        {/* Additional Amounts Section */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>Additional Amounts</Typography>
          {additionalAmounts.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Description"
                value={item.description}
                onChange={(e) => {
                  const newItems = [...additionalAmounts];
                  newItems[index].description = e.target.value;
                  setAdditionalAmounts(newItems);
                }}
              />
              <TextField
                type="number"
                label="Amount"
                value={item.amount}
                onChange={(e) => {
                  const newItems = [...additionalAmounts];
                  newItems[index].amount = parseFloat(e.target.value) || 0;
                  setAdditionalAmounts(newItems);
                }}
                sx={{ width: '200px' }}
              />
              <IconButton onClick={() => {
                setAdditionalAmounts(additionalAmounts.filter((_, i) => i !== index));
              }}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddAdditional}
            variant="outlined"
            size="small"
          >
            Add Additional Amount
          </Button>
        </Grid>

        {/* Deduction Items Section */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>Deductions</Typography>
          {deductionItems.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Description"
                value={item.description}
                onChange={(e) => {
                  const newItems = [...deductionItems];
                  newItems[index].description = e.target.value;
                  setDeductionItems(newItems);
                }}
              />
              <TextField
                type="number"
                label="Amount"
                value={item.amount}
                onChange={(e) => {
                  const newItems = [...deductionItems];
                  newItems[index].amount = parseFloat(e.target.value) || 0;
                  setDeductionItems(newItems);
                }}
                sx={{ width: '200px' }}
              />
              <IconButton onClick={() => {
                setDeductionItems(deductionItems.filter((_, i) => i !== index));
              }}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddDeduction}
            variant="outlined"
            size="small"
          >
            Add Deduction
          </Button>
        </Grid>

        <Grid item xs={12} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Generate Payroll
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

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
  const { enqueueSnackbar } = useSnackbar();

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
      setEmployees(response.data);
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
      enqueueSnackbar('Salary advance created successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error creating salary advance:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error creating salary advance', { variant: 'error' });
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
      // Get payroll details with items if needed
      const payrollResponse = await axios.get(`/api/hr/payroll/${payroll.id}`);
      const payrollDetails = payrollResponse.data;

      // Generate receipt HTML - no need to fetch settings anymore
      const response = await axios.post('/api/hr/payroll/print', {
        payroll: payrollDetails
      });

      // Create a new window and print
      const printWindow = window.open('', '_blank');
      printWindow.document.write(response.data.receiptHtml);
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

  const handlePayrollApproval = async (payrollId) => {
    try {
      await axios.put(`/api/hr/payroll/${payrollId}/approve`);
      // Refresh payroll data after approval
      fetchPayrolls();
    } catch (error) {
      console.error('Error approving payroll:', error);
      alert(error.response?.data?.message || 'Error approving payroll');
    }
  };

  const handleDeletePayroll = async (payrollId) => {
    try {
        await axios.delete(`/api/hr/payroll/${payrollId}`);
        fetchPayrolls();
    } catch (error) {
        console.error('Error deleting payroll:', error);
        alert(error.response?.data?.message || 'Error deleting payroll');
    }
  };

  const handlePayrollSubmit = async (formData) => {
    try {
      // Calculate totals
      const totalAdditional = formData.additional_amounts.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const totalDeductions = formData.deduction_items.reduce((sum, item) => sum + parseFloat(item.amount), 0);

      // Get employee's basic salary and pending advances
      const employee = employees.find(emp => emp.id === formData.employee_id);
      const basicSalary = employee ? parseFloat(employee.basic_salary) : 0;

      // Fetch approved salary advances for this employee
      const advancesResponse = await axios.get(`/api/hr/salary-advances/employee/${formData.employee_id}`);

      // Filter advances for the specific month and year
      const monthAdvances = advancesResponse.data
        .filter(adv => {
          const advanceDate = new Date(adv.request_date);
          return advanceDate.getMonth() + 1 === formData.month &&
                 advanceDate.getFullYear() === formData.year &&
                 adv.approval_status === 'approved';
        })
        .reduce((sum, adv) => sum + parseFloat(adv.amount), 0);

      // Total deductions include both deduction items and monthly advances
      const totalAllDeductions = totalDeductions + monthAdvances;

      // Ensure all numbers are properly parsed and calculated
      const finalBasicSalary = parseFloat(basicSalary.toFixed(2));
      const finalAdditional = parseFloat(totalAdditional.toFixed(2));
      const finalDeductions = parseFloat(totalAllDeductions.toFixed(2));
      const finalNetSalary = parseFloat((finalBasicSalary + finalAdditional - finalDeductions).toFixed(2));

      // Create main payroll record with correct calculations
      const payrollResponse = await axios.post('/api/hr/payroll', {
        employee_id: formData.employee_id,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        basic_salary: finalBasicSalary,
        additional_amount: finalAdditional,
        deductions: finalDeductions,
        net_salary: finalNetSalary,
        created_by: user.id
      });

      // If payroll created successfully, add the items
      if (payrollResponse.data?.id) {
        // Add additional amounts
        for (const item of formData.additional_amounts) {
          await axios.post('/api/hr/payroll-items', {
            payroll_id: payrollResponse.data.id,
            type: 'addition',
            description: item.description,
            amount: parseFloat(item.amount)
          });
        }

        // Add deductions
        for (const item of formData.deduction_items) {
          await axios.post('/api/hr/payroll-items', {
            payroll_id: payrollResponse.data.id,
            type: 'deduction',
            description: item.description,
            amount: parseFloat(item.amount)
          });
        }
      }
      enqueueSnackbar('Payroll generated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error generating payroll:', error);
      enqueueSnackbar('Error generating payroll', { variant: 'error' });
    }
    fetchPayrolls();
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          HR Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenAdvanceDialog(true)}
          >
            New Salary Advance
          </Button>
          <Button
            variant="contained"
            startIcon={<PayrollIcon />}
            onClick={() => setOpenPayrollDialog(true)}
          >
            Generate Payroll
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
          <Tab label="Payroll" />
          <Tab label="Salary Advances" />
          <Tab label="Reports" />
        </Tabs>

        {/* Payroll Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Month/Year</TableCell>
                  <TableCell>Basic Salary</TableCell>
                  <TableCell>Additional</TableCell>
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
                    <TableCell>{formatCurrency(payroll.additional_amount || 0, false)}</TableCell>
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
                      {(payroll.status?.toLowerCase() === 'pending' || payroll.status?.toLowerCase() === 'draft') && (
                        <IconButton
                          size="small"
                          onClick={() => handlePayrollApproval(payroll.id)}
                          sx={{ color: 'success.main', mr: 1 }}
                          title="Approve Payroll"
                        >
                          <ApproveIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handlePrintPayroll(payroll)}
                        sx={{ color: 'warning.main' }}
                        title="Print Payroll"
                      >
                        <PrintIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeletePayroll(payroll.id)}
                        sx={{ color: 'error.main', ml: 1 }}
                        title="Delete Payroll"
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

        {/* Salary Advances Tab */}
        <TabPanel value={tabValue} index={1}>
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
            <InputLabel
            required
            >Employee</InputLabel>
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
            required
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
      <Dialog
        open={openPayrollDialog}
        onClose={() => setOpenPayrollDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Generate Payroll</DialogTitle>
        <DialogContent>
          <PayrollForm
            onSubmit={handlePayrollSubmit}
            onClose={() => setOpenPayrollDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <ReportDialog />
    </Box>
  );
}