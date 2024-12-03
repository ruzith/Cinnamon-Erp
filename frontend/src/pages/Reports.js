import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reportType, setReportType] = useState('financial');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  });
  const [reportData, setReportData] = useState({
    period: { startDate: null, endDate: null },
    summary: {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      outstandingLoans: 0,
      activeAssets: 0,
      revenueGrowth: 0,
      profitMargin: 0,
      assetUtilization: 0,
      recommendations: ''
    },
    profitLoss: {
      revenue: 0,
      expenses: 0,
      netProfit: 0
    },
    balanceSheet: {
      assets: {
        current: [],
        fixed: [],
        totalCurrent: 0,
        totalFixed: 0,
        total: 0
      },
      liabilities: {
        current: [],
        longTerm: [],
        totalCurrent: 0,
        totalLongTerm: 0,
        total: 0
      },
      equity: {
        items: [],
        total: 0
      }
    },
    cashFlow: {
      operating: 0,
      investing: 0,
      financing: 0,
      netCashFlow: 0
    },
    ratios: {
      currentRatio: 0,
      quickRatio: 0,
      debtToEquity: 0,
      returnOnAssets: 0,
      returnOnEquity: 0
    },
    financialMetrics: [],
    inventoryMetrics: [],
    operationalMetrics: [],
    loanMetrics: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reports', {
        params: {
          type: reportType,
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        }
      });
      
      const data = {
        ...reportData,
        ...response.data,
        summary: {
          ...reportData.summary,
          ...response.data.summary
        }
      };
      
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  const handleDateChange = (type, newValue) => {
    setDateRange(prev => ({
      ...prev,
      [type]: newValue
    }));
  };

  const handleExportReport = async () => {
    try {
      const response = await axios.get('/api/reports/export', {
        params: {
          type: reportType,
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Report Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={handleReportTypeChange}
              >
                <MenuItem value="financial">Financial Report</MenuItem>
                <MenuItem value="inventory">Inventory Report</MenuItem>
                <MenuItem value="operational">Operational Report</MenuItem>
                <MenuItem value="loan">Loan Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(newValue) => handleDateChange('startDate', newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(newValue) => handleDateChange('endDate', newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportReport}
              fullWidth
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    ${reportData.summary.totalRevenue.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Expenses
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    ${reportData.summary.totalExpenses.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Net Income
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={reportData.summary.netIncome >= 0 ? 'success.main' : 'error.main'}
                  >
                    ${reportData.summary.netIncome.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Outstanding Loans
                  </Typography>
                  <Typography variant="h6">
                    ${reportData.summary.outstandingLoans.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Assets
                  </Typography>
                  <Typography variant="h6">
                    {reportData.summary.activeAssets}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts and Tables */}
          <Paper sx={{ p: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Overview" />
              <Tab label="Details" />
              <Tab label="Analysis" />
            </Tabs>

            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Revenue vs Expenses</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.financialMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#00C49F" name="Revenue" />
                      <Line type="monotone" dataKey="expenses" stroke="#FF8042" name="Expenses" />
                    </LineChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Category Distribution</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.operationalMetrics}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {reportData.operationalMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Inventory Levels</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.inventoryMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="#8884d8" name="Current Stock" />
                      <Bar dataKey="minimum" fill="#82ca9d" name="Minimum Level" />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Details Tab */}
            <TabPanel value={tabValue} index={1}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.financialMetrics.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell align="right">${row.amount}</TableCell>
                        <TableCell>{row.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Analysis Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Key Performance Indicators
                      </Typography>
                      <Typography variant="body1" paragraph>
                        Revenue Growth: {reportData.summary.revenueGrowth}%
                      </Typography>
                      <Typography variant="body1" paragraph>
                        Profit Margin: {reportData.summary.profitMargin}%
                      </Typography>
                      <Typography variant="body1" paragraph>
                        Asset Utilization: {reportData.summary.assetUtilization}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recommendations
                      </Typography>
                      <Typography variant="body1">
                        {reportData.summary.recommendations}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default Reports; 