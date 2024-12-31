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
} from '@mui/icons-material';
import axios from 'axios';
import PurchaseInvoiceForm from '../components/PurchaseInvoiceForm';
import { useCurrencyFormatter } from '../utils/currencyUtils';
import { formatDate, getCurrentDateTime } from '../utils/dateUtils';
import SummaryCard from '../components/common/SummaryCard';

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
    notes: ''
  });
  const [advancePaymentData, setAdvancePaymentData] = useState({
    contractor_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [contractors, setContractors] = useState([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  const { formatCurrency } = useCurrencyFormatter();
  const [openReassignDialog, setOpenReassignDialog] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState(null);
  const [newContractorId, setNewContractorId] = useState('');

  useEffect(() => {
    fetchManufacturingOrders();
    fetchEmployees();
    fetchProducts();
    fetchContractors();
    fetchAssignments();
  }, []);

  const fetchManufacturingOrders = async () => {
    try {
      const response = await axios.get('/api/manufacturing-orders');
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

  const fetchContractors = async () => {
    try {
      const response = await axios.get('/api/manufacturing/contractors');
      setContractors(response.data);
    } catch (error) {
      console.error('Error fetching contractors:', error);
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
        status: contractor.status || 'active'
      });
    } else {
      setSelectedContractor(null);
      setFormData({
        name: '',
        contractor_id: '',
        phone: '',
        address: '',
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
        await axios.put(`/api/manufacturing/contractors/${selectedContractor.id}`, formData);
      } else {
        await axios.post('/api/manufacturing/contractors', formData);
      }
      fetchContractors();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving contractor:', error);
      alert(error.response?.data?.message || 'Error saving contractor');
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
        await axios.put(`/api/manufacturing-orders/${selectedOrder.id}`, orderData);
      } else {
        await axios.post('/api/manufacturing-orders', orderData);
      }
      fetchManufacturingOrders();
      handleCloseOrderDialog();
    } catch (error) {
      console.error('Error saving manufacturing order:', error);
      alert(error.response?.data?.message || 'Error saving order');
    }
  };

  const handleDelete = async (contractorId) => {
    if (window.confirm('Are you sure you want to delete this contractor? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/manufacturing/contractors/${contractorId}`);
        fetchContractors();
      } catch (error) {
        if (error.response?.data?.activeAssignments || error.response?.data?.pendingPayments) {
          const shouldReassign = window.confirm(
            `This contractor has ${error.response.data.assignmentCount || 0} active assignments and ${error.response.data.pendingPayments || 0} pending payments. Would you like to reassign them to another contractor?`
          );

          if (shouldReassign) {
            setOpenReassignDialog(true);
            setContractorToDelete(contractorId);
          }
        } else {
          console.error('Error deleting contractor:', error);
          alert(error.response?.data?.message || 'Error deleting contractor');
        }
      }
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
        notes: assignment.notes || ''
      });
    } else {
      setAssignmentFormData({
        id: null,
        contractor_id: contractor ? contractor.id : '',
        quantity: '',
        duration: 1,
        duration_type: 'day',
        start_date: formatDate(getCurrentDateTime(), 'YYYY-MM-DD'),
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
        fetchContractors()
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

      fetchContractors();
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
      const response = await axios.get('/api/manufacturing/assignments');
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
    <>
      <IconButton
        size="small"
        onClick={() => handleOpenDialog(contractor)}
        sx={{ color: 'primary.main' }}
      >
        <EditIcon />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleOpenAssignmentDialog(null, contractor)}
        sx={{ color: 'success.main', ml: 1 }}
      >
        <AddIcon />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleOpenPaymentDialog(contractor)}
        sx={{ color: 'info.main', ml: 1 }}
      >
        <PaymentIcon />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleDelete(contractor.id)}
        sx={{ color: 'error.main', ml: 1 }}
      >
        <DeleteIcon />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => {
          setSelectedContractor(contractor);
          setOpenPurchaseDialog(true);
        }}
        sx={{ color: 'success.main', ml: 1 }}
      >
        <ShoppingCartIcon />
      </IconButton>
    </>
  );

  const handleReassignAndDelete = async () => {
    try {
      if (!newContractorId) {
        alert('Please select a new contractor');
        return;
      }

      await axios.delete(`/api/manufacturing/contractors/${contractorToDelete}?forceDelete=true&newContractorId=${newContractorId}`);
      setOpenReassignDialog(false);
      setContractorToDelete(null);
      setNewContractorId('');
      fetchContractors();
    } catch (error) {
      console.error('Error reassigning and deleting contractor:', error);
      alert(error.response?.data?.message || 'Error reassigning and deleting contractor');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Manufacturing Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Contractor
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={FactoryIcon}
            title="Manufacturing Orders"
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
            value={contractors.filter(c => c.status === 'active').length}
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

      {/* Tabs Navigation - Moved inside Paper component */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab label="Manufacturing Orders" />
          <Tab label="Contractors" />
          <Tab label="Cinnamon Assignments" />
        </Tabs>

        {/* Manufacturing Orders Tab */}
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
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenOrderDialog(order)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(order.id)}
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
        )}

        {/* Contractors Tab */}
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
                {contractors.map((contractor) => (
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

        {/* Assignments Tab */}
        {currentTab === 2 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Quantity (kg)</TableCell>
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
                      {contractors.find(c => c.id === assignment.contractor_id)?.name || 'Unknown'}
                    </TableCell>
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
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add the Manufacturing Order Dialog */}
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

      {/* Assign Cinnamon to Contractor Dialog */}
      <Dialog open={openAssignmentDialog} onClose={() => setOpenAssignmentDialog(false)}>
        <DialogTitle>Assign Cinnamon to Contractor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Contractor</InputLabel>
                <Select
                  value={assignmentFormData.contractor_id}
                  onChange={(e) => setAssignmentFormData(prev => ({
                    ...prev,
                    contractor_id: e.target.value
                  }))}
                >
                  {contractors.map(contractor => (
                    <MenuItem key={contractor.id} value={contractor.id}>
                      {contractor.name} ({contractor.contractor_id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quantity (kg)"
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignmentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignmentSubmit}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advance Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Process Advance Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Contractor</InputLabel>
                <Select
                  value={advancePaymentData.contractor_id}
                  onChange={(e) => setAdvancePaymentData(prev => ({
                    ...prev,
                    contractor_id: e.target.value
                  }))}
                >
                  {contractors.map(contractor => (
                    <MenuItem key={contractor.id} value={contractor.id}>
                      {contractor.name} ({contractor.contractor_id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
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
                label="Payment Date"
                type="date"
                value={advancePaymentData.payment_date}
                onChange={(e) => setAdvancePaymentData(prev => ({
                  ...prev,
                  payment_date: e.target.value
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

      {/* Contractor Dialog */}
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
      />

      {/* Reassign Dialog */}
      <Dialog open={openReassignDialog} onClose={() => setOpenReassignDialog(false)}>
        <DialogTitle>Reassign Assignments</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>New Contractor</InputLabel>
                <Select
                  value={newContractorId}
                  onChange={(e) => setNewContractorId(e.target.value)}
                >
                  {contractors
                    .filter(c => c.id !== contractorToDelete)
                    .map(contractor => (
                      <MenuItem key={contractor.id} value={contractor.id}>
                        {contractor.name} ({contractor.contractor_id})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReassignDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReassignAndDelete}>
            Reassign and Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Manufacturing;