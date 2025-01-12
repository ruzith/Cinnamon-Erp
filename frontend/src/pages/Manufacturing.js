import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  IconButton,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  InputAdornment,
  TableSortLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Factory as FactoryIcon,
  Inventory as ProductIcon,
  Engineering as WorkerIcon,
  Grade as QualityIcon,
  Payment as PaymentIcon,
  ShoppingCart as ShoppingCartIcon,
  Speed as SpeedIcon,
  Grade as GradeIcon,
  Print as PrintIcon,
  Clear as ClearIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import axios from 'axios';
import PurchaseInvoiceForm from '../components/PurchaseInvoiceForm';
import { useCurrencyFormatter } from '../utils/currencyUtils';
import { formatDate, getCurrentDateTime } from '../utils/dateUtils';
import SummaryCard from '../components/common/SummaryCard';
import { fetchCuttingContractors } from '../features/cutting/cuttingSlice';

const STATUS_OPTIONS = ['planned', 'in_progress', 'completed', 'cancelled'];

const Manufacturing = () => {
  const [manufacturingOrders, setManufacturingOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contractor_id: '',
    phone: '',
    address: '',
    cutting_rate: 250,
    status: 'active'
  });
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    product_id: '',
    quantity: '',
    assigned_to: '',
    status: 'planned',
    priority: 'normal',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: ''
  });
  const [products, setProducts] = useState([]);
  const [assignmentFormData, setAssignmentFormData] = useState({
    contractor_id: '',
    quantity: '',
    duration: 1,
    duration_type: 'day',
    start_date: new Date().toISOString().split('T')[0],
    raw_material_id: '',
    raw_material_quantity: '',
    notes: ''
  });
  const [advancePaymentData, setAdvancePaymentData] = useState({
    contractor_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [cuttingContractors, setCuttingContractors] = useState([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  const { formatCurrency } = useCurrencyFormatter();
  const [openReassignDialog, setOpenReassignDialog] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState(null);
  const [newContractorId, setNewContractorId] = useState('');
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [assignmentFilters, setAssignmentFilters] = useState({
    contractor_name: '',
    start_date: '',
    end_date: ''
  });
  const [reportData, setReportData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    fetchManufacturingOrders();
    fetchEmployees();
    fetchProducts();
    fetchCuttingContractors();
    fetchAssignments();
    fetchRawMaterials();
    fetchPurchases();
  }, []);

  const fetchManufacturingOrders = async () => {
    try {
      const response = await axios.get('/api/manufacturing/orders');
      setManufacturingOrders(response.data);
    } catch (error) {
      console.error('Error fetching manufacturing orders:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      console.log('Employee data:', response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCuttingContractors = async () => {
    try {
      const response = await axios.get('/api/cutting/contractors?include_contribution=true');
      setCuttingContractors(response.data);
    } catch (error) {
      console.error('Error fetching cutting contractors:', error);
    }
  };

  const handleOpenDialog = (contractor = null) => {
    if (contractor) {
      setSelectedContractor(contractor);
      setFormData({
        name: contractor.name,
        contractor_id: contractor.contractor_id,
        phone: contractor.phone,
        address: contractor.address,
        cutting_rate: contractor.cutting_rate,
        status: contractor.status || 'active'
      });
    } else {
      setSelectedContractor(null);
      setFormData({
        name: '',
        contractor_id: '',
        phone: '',
        address: '',
        cutting_rate: 250,
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'assignedWorkers' ?
        typeof value === 'string' ? value.split(',') : value :
        value
    }));
  };

  const handleContractorSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedContractor) {
        await axios.put(`/api/cutting/contractors/${selectedContractor.id}`, formData);
      } else {
        await axios.post('/api/cutting/contractors', formData);
      }
      handleCloseDialog();
      fetchCuttingContractors();
    } catch (error) {
      console.error('Error submitting contractor:', error);
      alert('Failed to save contractor');
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        product_id: parseInt(orderFormData.product_id) || null,
        quantity: parseInt(orderFormData.quantity) || null,
        assigned_to: parseInt(orderFormData.assigned_to) || null,
        status: orderFormData.status,
        priority: orderFormData.priority,
        start_date: orderFormData.start_date,
        end_date: orderFormData.end_date || null,
        notes: orderFormData.notes || ''
      };

      if (!orderData.product_id || !orderData.quantity || !orderData.assigned_to) {
        alert('Please fill in all required fields');
        return;
      }

      if (selectedOrder) {
        await axios.put(`/api/manufacturing/orders/${selectedOrder.id}`, orderData);
      } else {
        await axios.post('/api/manufacturing/orders', orderData);
      }
      fetchManufacturingOrders();
      handleCloseOrderDialog();
    } catch (error) {
      console.error('Error saving manufacturing order:', error);
      alert(error.response?.data?.message || 'Error saving order');
    }
  };

  const handleDeleteContractor = async (contractorId) => {
    try {
      await axios.delete(`/api/manufacturing/contractors/${contractorId}`);
      fetchCuttingContractors();
    } catch (error) {
      if (error.response?.data?.assignmentCount > 0) {
        setContractorToDelete(contractorId);
        setOpenReassignDialog(true);
      } else {
        console.error('Error deleting contractor:', error);
        alert(error.response?.data?.message || 'Error deleting contractor');
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`/api/manufacturing/orders/${orderId}`);
      fetchManufacturingOrders();
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Cannot delete orders')) {
        if (window.confirm('This order is in progress or completed. Would you like to force delete it?')) {
          handleForceDeleteOrder(orderId);
        }
      } else {
        console.error('Error deleting order:', error);
        alert(error.response?.data?.message || 'Error deleting order');
      }
    }
  };

  const handleForceDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`/api/manufacturing/orders/${orderId}?forceDelete=true`);
      fetchManufacturingOrders();
    } catch (error) {
      console.error('Error force deleting order:', error);
      alert(error.response?.data?.message || 'Error force deleting order');
    }
  };

  const calculateAverageQuality = (orders) => {
    const completedOrders = orders.filter(order => order.status === 'completed');
    if (!completedOrders.length) return 0;

    const qualityMap = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
    const sum = completedOrders.reduce((acc, order) => acc + (qualityMap[order.qualityGrade] || 0), 0);
    return (sum / completedOrders.length).toFixed(1);
  };

  const summaryStats = {
    totalOrders: manufacturingOrders.length,
    activeOrders: manufacturingOrders.filter(order => order.status === 'in_progress').length,
    completedOrders: manufacturingOrders.filter(order => order.status === 'completed').length,
    averageQuality: calculateAverageQuality(manufacturingOrders)
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleOpenOrderDialog = (order = null) => {
    if (order) {
      setSelectedOrder(order);
      setOrderFormData({
        product_id: order.product_id,
        quantity: order.quantity,
        assigned_to: order.assigned_to,
        status: order.status,
        priority: order.priority,
        start_date: order.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        end_date: order.end_date?.split('T')[0] || '',
        notes: order.notes
      });
    } else {
      setSelectedOrder(null);
      setOrderFormData({
        product_id: '',
        quantity: '',
        assigned_to: '',
        status: 'planned',
        priority: 'normal',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: ''
      });
    }
    setOpenOrderDialog(true);
  };

  const handleCloseOrderDialog = () => {
    setOpenOrderDialog(false);
    setSelectedOrder(null);
  };

  const handleOpenAssignmentDialog = (assignment = null, contractor = null) => {
    if (assignment) {
      setAssignmentFormData({
        id: assignment.id,
        contractor_id: assignment.contractor_id,
        quantity: assignment.quantity,
        duration: assignment.duration,
        duration_type: assignment.duration_type,
        start_date: assignment.start_date ? formatDate(assignment.start_date, 'YYYY-MM-DD') : formatDate(getCurrentDateTime(), 'YYYY-MM-DD'),
        raw_material_id: assignment.raw_material_id,
        raw_material_quantity: assignment.raw_material_quantity,
        notes: assignment.notes || ''
      });
    } else if (contractor) {
      setAssignmentFormData({
        contractor_id: contractor.id,
        quantity: '',
        duration: 1,
        duration_type: 'day',
        start_date: formatDate(getCurrentDateTime(), 'YYYY-MM-DD'),
        raw_material_id: '',
        raw_material_quantity: '',
        notes: ''
      });
    }
    setOpenAssignmentDialog(true);
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (assignmentFormData.id) {
        // Update existing assignment
        response = await axios.put(`/api/manufacturing/assignments/${assignmentFormData.id}`, assignmentFormData);
      } else {
        // Create new assignment
        response = await axios.post('/api/manufacturing/assignments', assignmentFormData);
      }

      // Refresh both assignments and contractors data
      await Promise.all([
        fetchAssignments(),
        fetchCuttingContractors(),
        fetchRawMaterials() // Refresh raw materials after assignment
      ]);

      setOpenAssignmentDialog(false);
      // Reset form
      setAssignmentFormData({
        id: null,
        contractor_id: '',
        quantity: '',
        duration: 1,
        duration_type: 'day',
        start_date: new Date().toISOString().split('T')[0],
        raw_material_id: '',
        raw_material_quantity: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert(error.response?.data?.message || 'Error saving assignment');
    }
  };

  const handleAdvancePayment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/manufacturing/advance-payments', advancePaymentData);

      // Create a new window and write the receipt HTML
      const receiptWindow = window.open('', '_blank');
      receiptWindow.document.write(response.data.receiptHtml);
      receiptWindow.document.close();

      // Add print automatically option
      receiptWindow.onload = function() {
        receiptWindow.print();
      };

      fetchCuttingContractors();
      setOpenPaymentDialog(false);
      setAdvancePaymentData({
        contractor_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (error) {
      console.error('Error processing advance payment:', error);
      alert(error.response?.data?.message || 'Error processing payment');
    }
  };

  const fetchAssignments = async () => {
    try {
      const params = new URLSearchParams();
      if (assignmentFilters.contractor_name) {
        params.append('contractor_name', assignmentFilters.contractor_name);
      }
      if (assignmentFilters.start_date) {
        params.append('start_date', assignmentFilters.start_date);
      }
      if (assignmentFilters.end_date) {
        params.append('end_date', assignmentFilters.end_date);
      }

      const response = await axios.get(`/api/manufacturing/assignments?${params.toString()}`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleOpenPaymentDialog = (contractor = null) => {
    if (contractor) {
      setAdvancePaymentData(prev => ({
        ...prev,
        contractor_id: contractor.id,
        notes: `Advance payment for ${contractor.name}`
      }));
    } else {
      setAdvancePaymentData({
        contractor_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setOpenPaymentDialog(true);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const renderContractorActions = (contractor) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
      <Button
        size="small"
        color="success"
        onClick={() => handleOpenAssignmentDialog(null, contractor)}
      >
        Assign
      </Button>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => handleOpenPaymentDialog(contractor)}
          sx={{ color: 'warning.main', ml: 1 }}
        >
          <PaymentIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleOpenDialog(contractor)}
          sx={{ color: 'primary.main', ml: 1 }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleDeleteContractor(contractor.id)}
          sx={{ color: 'error.main', ml: 1 }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Box>
  );

  const handleReassignAndDelete = async () => {
    if (!newContractorId) {
      alert('Please select a new contractor');
      return;
    }

    try {
      await axios.delete(`/api/manufacturing/contractors/${contractorToDelete}?forceDelete=true&newContractorId=${newContractorId}`);
      setOpenReassignDialog(false);
      setContractorToDelete(null);
      setNewContractorId('');
      fetchCuttingContractors();
      fetchAssignments();
    } catch (error) {
      console.error('Error in reassignment:', error);
      alert('Failed to reassign tasks and delete contractor');
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const response = await axios.get('/api/inventory/raw-materials');
      setRawMaterials(response.data);
    } catch (error) {
      console.error('Error fetching raw materials:', error);
    }
  };

  const handlePrintInvoice = async (purchase) => {
    try {
      const response = await axios.get(`/api/manufacturing/invoices/${purchase.id}/print`);

      // Create a new window and write the invoice HTML
      const invoiceWindow = window.open('', '_blank');
      if (invoiceWindow) {
        invoiceWindow.document.write(response.data.invoiceHtml);
        invoiceWindow.document.close();

        // Print automatically
        invoiceWindow.onload = function() {
          invoiceWindow.print();
        };
      } else {
        alert('Please allow pop-ups to print invoices');
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert(error.response?.data?.message || 'Error printing invoice');
    }
  };

  const handleMarkAsPaid = async (order) => {
    try {
      await axios.put(`/api/manufacturing/orders/${order.id}/mark-paid`);
      fetchManufacturingOrders(); // Refresh the orders list
      alert('Order marked as paid successfully');
    } catch (error) {
      console.error('Error marking order as paid:', error);
      alert(error.response?.data?.message || 'Error marking order as paid');
    }
  };

  const handlePrintManufacturingReceipt = async (order) => {
    try {
      const response = await axios.get(`/api/manufacturing/orders/${order.id}/receipt`);

      // Create a new window and write the receipt HTML
      const receiptWindow = window.open('', '_blank');
      receiptWindow.document.write(response.data.receiptHtml);
      receiptWindow.document.close();

      // Print automatically
      receiptWindow.onload = function() {
        receiptWindow.print();
      };
    } catch (error) {
      console.error('Error printing manufacturing receipt:', error);
      alert(error.response?.data?.message || 'Error printing receipt');
    }
  };

  const generateReport = async () => {
    try {
      setReportError(null);
      const params = new URLSearchParams();
      if (assignmentFilters.contractor_name) {
        params.append('contractor_name', assignmentFilters.contractor_name);
      }
      if (assignmentFilters.start_date) {
        params.append('start_date', assignmentFilters.start_date);
      }
      if (assignmentFilters.end_date) {
        params.append('end_date', assignmentFilters.end_date);
      }

      const response = await axios.get(`/api/manufacturing/reports/assignments?${params.toString()}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportError(error.response?.data?.message || 'Error generating report');
    }
  };

  useEffect(() => {
    if (currentTab === 4) {
      generateReport();
    }
    if (currentTab === 2) {
      fetchPurchases();
    }
    if (currentTab === 3) {
      fetchCuttingContractors();
      fetchAssignments();
    }
  }, [currentTab]);

  const handleOpenReport = (assignment) => {
    setSelectedReport(assignment);
    setReportDialog(true);
  };

  const handleCloseReport = () => {
    setReportDialog(false);
    setSelectedReport(null);
  };

  const handlePrintReport = async (assignment) => {
    try {
      const response = await axios.get(`/api/manufacturing/assignments/${assignment.id}/report`);

      // Create a new window and write the report HTML
      const reportWindow = window.open('', '_blank');
      reportWindow.document.write(response.data.reportHtml);
      reportWindow.document.close();

      // Print automatically
      reportWindow.onload = function() {
        reportWindow.print();
      };
    } catch (error) {
      console.error('Error printing assignment report:', error);
      alert(error.response?.data?.message || 'Error printing report');
    }
  };

  const ReportDialog = () => (
    <Dialog
      open={reportDialog}
      onClose={handleCloseReport}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Assignment Report - {selectedReport?.contractor_name}
      </DialogTitle>
      <DialogContent>
        {selectedReport && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Raw Material"
                  value={`${selectedReport.raw_material_quantity} kg`}
                  icon={ProductIcon}
                  iconColor="primary.main"
                  gradientColor="primary"
                  subtitle={selectedReport.raw_material_name}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Finished Product"
                  value={`${selectedReport.quantity} kg`}
                  icon={ProductIcon}
                  iconColor="success.main"
                  gradientColor="success"
                  subtitle="Expected Output"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Efficiency"
                  value={selectedReport.efficiency === 'N/A' ? 'N/A' :
                         selectedReport.efficiency.endsWith('*') ?
                         `${selectedReport.efficiency.slice(0, -1)}%` :
                         `${selectedReport.efficiency}%`}
                  icon={SpeedIcon}
                  iconColor="warning.main"
                  gradientColor="warning"
                  subtitle={selectedReport.status === 'active' ? 'Target Efficiency' :
                           selectedReport.status === 'completed' ? 'Actual Efficiency' : 'Not Applicable'}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 2 }}>Assignment Details</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Contract Information</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Contractor ID:</strong> {selectedReport.contractor_id}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {selectedReport.contractor_phone}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Start Date:</strong> {new Date(selectedReport.start_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>End Date:</strong> {new Date(selectedReport.end_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Production Details</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Raw Material:</strong> {selectedReport.raw_material_name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Duration:</strong> {selectedReport.duration} {selectedReport.duration_type}(s)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Status:</strong>
                      <Chip
                        size="small"
                        label={selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                        color={
                          selectedReport.status === 'completed' ? 'success' :
                          selectedReport.status === 'active' ? 'primary' :
                          'default'
                        }
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography variant="body2">
                      <strong>Notes:</strong> {selectedReport.notes || 'N/A'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {selectedReport.status === 'completed' && (
              <Typography variant="body1" color="success.main" sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon /> Assignment completed successfully
              </Typography>
            )}

            {selectedReport.status === 'cancelled' && (
              <Typography variant="body1" color="error.main" sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CancelIcon /> Assignment was cancelled
              </Typography>
            )}

            {selectedReport.status === 'active' && (
              <Typography variant="body1" color="primary.main" sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon /> Assignment is in progress
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseReport}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  useEffect(() => {
    fetchAssignments();
  }, [assignmentFilters]);

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await axios.delete(`/api/manufacturing/assignments/${assignmentId}`);
      await Promise.all([
        fetchAssignments(),
        fetchCuttingContractors(),
        fetchRawMaterials()
      ]);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert(error.response?.data?.message || 'Error deleting assignment');
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await axios.get('/api/manufacturing/purchases');
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const handlePurchaseSuccess = async () => {
    await Promise.all([
      fetchManufacturingOrders(),
      fetchRawMaterials(),
      fetchCuttingContractors(),
      fetchPurchases()
    ]);
    setOpenPurchaseDialog(false);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Manufacturing Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              if (cuttingContractors.length > 0) {
                setSelectedContractor(cuttingContractors[0]);
                setOpenPurchaseDialog(true);
              } else {
                alert('Please add cutting contractors first');
              }
            }}
          >
            New Purchase
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Contractor
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenOrderDialog()}
          >
            New Order
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={FactoryIcon}
            title="Total Orders"
            value={manufacturingOrders.length}
            subtitle={`${manufacturingOrders.filter(o => o.status === 'in_progress').length} In Progress`}
            iconColor="#9C27B0"
            gradientColor="secondary"
            trend={`${manufacturingOrders.filter(o => o.status === 'completed').length} Completed`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={WorkerIcon}
            title="Active Contractors"
            value={cuttingContractors.filter(c => c.status === 'active').length}
            subtitle={`${assignments.filter(a => a.status === 'active').length} Active Assignments`}
            iconColor="#D32F2F"
            gradientColor="error"
            trend={`${formatCurrency(assignments.reduce((sum, a) => sum + parseFloat(a.quantity), 0))} kg Total Assigned`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={SpeedIcon}
            title="Avg. Production Efficiency"
            value={`${(manufacturingOrders
              .filter(o => o.status === 'completed')
              .reduce((sum, o) => sum + parseFloat(o.efficiency), 0) /
              manufacturingOrders.filter(o => o.status === 'completed').length * 100).toFixed(1)}%`}
            subtitle="Based on Completed Orders"
            iconColor="#ED6C02"
            gradientColor="warning"
            trend={`${manufacturingOrders.filter(o => o.status === 'completed').length} Orders Analyzed`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={QualityIcon}
            title="Avg. Defect Rate"
            value={`${(manufacturingOrders
              .filter(o => o.status === 'completed')
              .reduce((sum, o) => sum + parseFloat(o.defect_rate), 0) /
              manufacturingOrders.filter(o => o.status === 'completed').length).toFixed(1)}%`}
            subtitle="Quality Control Metric"
            iconColor="#2E7D32"
            gradientColor="success"
            trend={`${formatCurrency(manufacturingOrders
              .filter(o => o.status === 'completed')
              .reduce((sum, o) => sum + parseFloat(o.downtime_hours), 0))} Hours Downtime`}
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab label="Orders" />
          <Tab label="Contractors" />
          <Tab label="Purchases" />
          <Tab label="Cinnamon Assignments" />
          <Tab label="Reports" />
        </Tabs>

        {currentTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell></TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {manufacturingOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{products.find(p => p.id === order.product_id)?.name || 'Unknown'}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>{new Date(order.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.payment_status || 'pending'}
                        color={order.payment_status === 'paid' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {order.status === 'completed' && order.payment_status !== 'paid' && (
                        <Button
                          size="small"
                          color="success"
                          onClick={() => handleMarkAsPaid(order)}
                        >
                          Paid
                        </Button>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={() => handlePrintManufacturingReceipt(order)}
                          sx={{ color: 'info.main' }}
                        >
                          <PrintIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenOrderDialog(order)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteOrder(order.id)}
                          sx={{ color: 'error.main' }}
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
        )}

        {currentTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contractor ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Active Assignments</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cuttingContractors.map((contractor) => (
                  <TableRow key={contractor.id} hover>
                    <TableCell>{contractor.contractor_id}</TableCell>
                    <TableCell>{contractor.name}</TableCell>
                    <TableCell>{contractor.phone}</TableCell>
                    <TableCell>{contractor.active_assignments || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={contractor.status}
                        color={contractor.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {renderContractorActions(contractor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {currentTab === 2 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Invoice No</TableCell>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Cutting Rate</TableCell>
                  <TableCell>Advance Payment</TableCell>
                  <TableCell>Final Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id} hover>
                    <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                    <TableCell>{purchase.invoice_number}</TableCell>
                    <TableCell>{purchase.contractor_name}</TableCell>
                    <TableCell>{`${purchase.product_name} - ${purchase.quantity} ${purchase.unit}`}</TableCell>
                    <TableCell>{formatCurrency(purchase.total_amount)}</TableCell>
                    <TableCell>{formatCurrency(purchase.cutting_rate)}/kg</TableCell>
                    <TableCell>{formatCurrency(purchase.advance_payment)}</TableCell>
                    <TableCell>{formatCurrency(purchase.final_amount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={purchase.status}
                        color={
                          purchase.status === 'paid' ? 'success' :
                          purchase.status === 'confirmed' ? 'info' :
                          purchase.status === 'cancelled' ? 'error' :
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handlePrintInvoice(purchase)}
                        sx={{ color: 'info.main' }}
                      >
                        <PrintIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {currentTab === 3 && (
          <>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Contractor</InputLabel>
                    <Select
                      value={assignmentFilters.contractor_name}
                      label="Contractor"
                      onChange={(e) => setAssignmentFilters(prev => ({
                        ...prev,
                        contractor_name: e.target.value
                      }))}
                      endAdornment={
                        assignmentFilters.contractor_name && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() => setAssignmentFilters(prev => ({
                              ...prev,
                              contractor_name: ''
                            }))}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>All Contractors</em>
                      </MenuItem>
                      {cuttingContractors.map((contractor) => (
                        <MenuItem key={contractor.id} value={contractor.name}>
                          {contractor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={assignmentFilters.start_date}
                    onChange={(e) => setAssignmentFilters(prev => ({
                      ...prev,
                      start_date: e.target.value
                    }))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: assignmentFilters.start_date && (
                        <IconButton
                          size="small"
                          onClick={() => setAssignmentFilters(prev => ({
                            ...prev,
                            start_date: ''
                          }))}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={assignmentFilters.end_date}
                    onChange={(e) => setAssignmentFilters(prev => ({
                      ...prev,
                      end_date: e.target.value
                    }))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: assignmentFilters.end_date && (
                        <IconButton
                          size="small"
                          onClick={() => setAssignmentFilters(prev => ({
                            ...prev,
                            end_date: ''
                          }))}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                      inputProps: {
                        min: assignmentFilters.start_date || undefined
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contractor</TableCell>
                    <TableCell>Raw Material</TableCell>
                    <TableCell>Raw Material Qty</TableCell>
                    <TableCell>Expected Output (kg)</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id} hover>
                      <TableCell>
                        {cuttingContractors.find(c => c.id === assignment.contractor_id)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {rawMaterials.find(r => r.id === assignment.raw_material_id)?.product_name || 'N/A'}
                      </TableCell>
                      <TableCell>{assignment.raw_material_quantity || 'N/A'}</TableCell>
                      <TableCell>{assignment.quantity}</TableCell>
                      <TableCell>{`${assignment.duration} ${assignment.duration_type}(s)`}</TableCell>
                      <TableCell>{new Date(assignment.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.status}
                          color={getStatusColor(assignment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenAssignmentDialog(assignment)}
                          sx={{ color: 'primary.main', ml: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAssignment(assignment.id)}
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
          </>
        )}

        {currentTab === 4 && (
          <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Contractor</InputLabel>
                    <Select
                      value={assignmentFilters.contractor_name}
                      label="Contractor"
                      onChange={(e) => setAssignmentFilters(prev => ({
                        ...prev,
                        contractor_name: e.target.value
                      }))}
                      endAdornment={
                        assignmentFilters.contractor_name && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() => setAssignmentFilters(prev => ({
                              ...prev,
                              contractor_name: ''
                            }))}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>All Contractors</em>
                      </MenuItem>
                      {cuttingContractors.map((contractor) => (
                        <MenuItem key={contractor.id} value={contractor.name}>
                          {contractor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={assignmentFilters.start_date}
                    onChange={(e) => setAssignmentFilters(prev => ({
                      ...prev,
                      start_date: e.target.value
                    }))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: assignmentFilters.start_date && (
                        <IconButton
                          size="small"
                          onClick={() => setAssignmentFilters(prev => ({
                            ...prev,
                            start_date: ''
                          }))}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={assignmentFilters.end_date}
                    onChange={(e) => setAssignmentFilters(prev => ({
                      ...prev,
                      end_date: e.target.value
                    }))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: assignmentFilters.end_date && (
                        <IconButton
                          size="small"
                          onClick={() => setAssignmentFilters(prev => ({
                            ...prev,
                            end_date: ''
                          }))}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                      inputProps: {
                        min: assignmentFilters.start_date || undefined
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

            <Grid container spacing={3}>
              {reportData.map((assignment) => (
                <Grid item xs={12} md={6} lg={4} key={assignment.id}>
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
                    onClick={() => handleOpenReport(assignment)}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {assignment.contractor_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {assignment.raw_material_name} • {assignment.status}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Raw Material
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={`${assignment.raw_material_quantity} ${assignment.raw_material_unit}`}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Finished Product
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={`${assignment.quantity} kg`}
                            color="success"
                            size="small"
                          />
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Efficiency
                      </Typography>
                      <Typography variant="body2">
                        {assignment.efficiency}% • Duration: {assignment.duration} {assignment.duration_type}(s)
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AssessmentIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReport(assignment);
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
        )}
      </Paper>

      <Dialog open={openOrderDialog} onClose={handleCloseOrderDialog}>
        <DialogTitle>
          {selectedOrder ? 'Edit Manufacturing Order' : 'New Manufacturing Order'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product"
                name="product_id"
                select
                value={orderFormData.product_id}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  product_id: e.target.value
                }))}
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={orderFormData.quantity}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  quantity: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assigned To"
                name="assigned_to"
                select
                value={orderFormData.assigned_to}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  assigned_to: e.target.value
                }))}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name || 'Unknown Employee'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                required
                fullWidth
                label="Start Date"
                name="start_date"
                type="date"
                value={orderFormData.start_date}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  start_date: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
                error={!orderFormData.start_date}
                helperText={!orderFormData.start_date ? 'Start date is required' : ''}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Date"
                name="end_date"
                type="date"
                value={orderFormData.end_date}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  end_date: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
                helperText="Optional"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={orderFormData.notes}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Status"
                name="status"
                select
                value={orderFormData.status}
                onChange={(e) => setOrderFormData(prev => ({
                  ...prev,
                  status: e.target.value
                }))}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleOrderSubmit}>
            {selectedOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAssignmentDialog} onClose={() => setOpenAssignmentDialog(false)}>
        <DialogTitle>Assign Cinnamon to Contractor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Raw Material</InputLabel>
                <Select
                  value={assignmentFormData.raw_material_id}
                  onChange={(e) => setAssignmentFormData(prev => ({
                    ...prev,
                    raw_material_id: e.target.value
                  }))}
                  required
                >
                  {rawMaterials.map(material => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.product_name} (Stock: {material.quantity} {material.unit})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Raw Material Quantity"
                type="number"
                value={assignmentFormData.raw_material_quantity}
                onChange={(e) => setAssignmentFormData(prev => ({
                  ...prev,
                  raw_material_quantity: e.target.value
                }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expected Output Quantity (kg)"
                type="number"
                value={assignmentFormData.quantity}
                onChange={(e) => setAssignmentFormData(prev => ({
                  ...prev,
                  quantity: e.target.value
                }))}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Duration"
                type="number"
                value={assignmentFormData.duration}
                onChange={(e) => setAssignmentFormData(prev => ({
                  ...prev,
                  duration: e.target.value
                }))}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Duration Type</InputLabel>
                <Select
                  value={assignmentFormData.duration_type}
                  onChange={(e) => setAssignmentFormData(prev => ({
                    ...prev,
                    duration_type: e.target.value
                  }))}
                >
                  <MenuItem value="day">Days</MenuItem>
                  <MenuItem value="week">Weeks</MenuItem>
                  <MenuItem value="month">Months</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={assignmentFormData.start_date}
                onChange={(e) => setAssignmentFormData(prev => ({
                  ...prev,
                  start_date: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={assignmentFormData.notes}
                onChange={(e) => setAssignmentFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignmentDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignmentSubmit}
            disabled={!assignmentFormData.quantity || !assignmentFormData.raw_material_id || !assignmentFormData.raw_material_quantity}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Process Advance Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={advancePaymentData.amount}
                onChange={(e) => setAdvancePaymentData(prev => ({
                  ...prev,
                  amount: e.target.value
                }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={advancePaymentData.notes}
                onChange={(e) => setAdvancePaymentData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdvancePayment}>
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedContractor ? 'Edit Contractor' : 'New Contractor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contractor ID"
                name="contractor_id"
                value={formData.contractor_id}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cutting Rate"
                name="cutting_rate"
                type="number"
                value={formData.cutting_rate}
                onChange={handleInputChange}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs.</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleContractorSubmit}>
            {selectedContractor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <PurchaseInvoiceForm
        open={openPurchaseDialog}
        onClose={() => {
          setOpenPurchaseDialog(false);
          setSelectedContractor(null);
        }}
        selectedContractor={selectedContractor}
        onSuccess={handlePurchaseSuccess}
        contractors={cuttingContractors}
      />

      <Dialog
        open={openReassignDialog}
        onClose={() => {
          setOpenReassignDialog(false);
          setContractorToDelete(null);
          setNewContractorId('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reassign Contractor Work</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              This contractor has active assignments. Please select a new contractor to take over these assignments before deleting.
            </Alert>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>New Contractor</InputLabel>
              <Select
                value={newContractorId}
                onChange={(e) => setNewContractorId(e.target.value)}
                label="New Contractor"
              >
                {cuttingContractors
                  .filter(c => c.id !== contractorToDelete && c.status === 'active')
                  .map((contractor) => (
                    <MenuItem key={contractor.id} value={contractor.id}>
                      {contractor.name} ({contractor.contractor_id})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenReassignDialog(false);
              setContractorToDelete(null);
              setNewContractorId('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReassignAndDelete}
            color="primary"
            disabled={!newContractorId}
          >
            Reassign and Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ReportDialog />
    </Box>
  );
};

export default Manufacturing;