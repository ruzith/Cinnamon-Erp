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
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Engineering as WorkerIcon,
  Forest as ForestIcon,
  Assignment as AssignmentIcon,
  Groups as ContractorsIcon,
  Payment as PaymentIcon,
  Done as DoneIcon,
  Print as PrintIcon,
  Money as MoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import SummaryCard from '../components/common/SummaryCard';
import { useSnackbar } from 'notistack';
import { useCurrencyFormatter } from '../utils/currencyUtils';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const CuttingManagement = () => {
  const { formatCurrency } = useCurrencyFormatter();
  const [contractors, setContractors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contractor_id: '',
    phone: '',
    address: ''
  });
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState({
    contractor_id: '',
    land_id: '',
    start_date: '',
    end_date: '',
    status: 'active'
  });
  const [lands, setLands] = useState([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    contractor_id: '',
    assignment_id: null,
    amount: 250,
    companyContribution: 100,
    manufacturingContribution: 150,
    status: 'pending',
    notes: ''
  });
  const [openReassignDialog, setOpenReassignDialog] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState(null);
  const [newContractorId, setNewContractorId] = useState('');
  const [openCompletionDialog, setOpenCompletionDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [completionFormData, setCompletionFormData] = useState({
    assignment_id: '',
    raw_item_id: '',
    quantity_received: '',
  });
  const [tabValue, setTabValue] = useState(0);
  const [openAdvancePaymentDialog, setOpenAdvancePaymentDialog] = useState(false);
  const [advancePaymentFormData, setAdvancePaymentFormData] = useState({
    contractor_id: '',
    amount: '',
    notes: '',
    status: 'pending'
  });
  const [openCuttingPaymentDialog, setOpenCuttingPaymentDialog] = useState(false);
  const [cuttingPaymentFormData, setCuttingPaymentFormData] = useState({
    contractor_id: '',
    assignment_id: '',
    quantity_kg: '',
    price_per_kg: 300,
    total_amount: 0,
    company_contribution: 180,
    manufacturing_contribution: 120,
    notes: '',
    status: 'pending',
    isFromAssignment: false
  });
  const [payments, setPayments] = useState([]);
  const [advancePayments, setAdvancePayments] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [reassignDialog, setReassignDialog] = useState(false);
  const [reassignmentData, setReassignmentData] = useState({
    oldContractorId: null,
    newContractorId: '',
    advancePayments: [],
    assignments: []
  });

  useEffect(() => {
    fetchContractors();
    fetchAssignments();
    fetchLands();
    fetchInventoryItems();
    fetchPayments();
    fetchAdvancePayments();
  }, []);

  const fetchContractors = async () => {
    try {
      const response = await axios.get('/api/cutting/contractors');
      setContractors(response.data);
    } catch (error) {
      console.error('Error fetching contractors:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/api/cutting/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchLands = async () => {
    try {
      // Only fetch active lands for the initial load
      const response = await axios.get('/api/lands?status=active');
      setLands(response.data);
    } catch (error) {
      console.error('Error fetching lands:', error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await axios.get('/api/inventory?type=raw_material');
      setInventoryItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get('/api/cutting/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchAdvancePayments = async () => {
    try {
      const response = await axios.get('/api/cutting/advance-payments');
      setAdvancePayments(response.data);
    } catch (error) {
      console.error('Error fetching advance payments:', error);
    }
  };

  const handleOpenDialog = (contractor = null) => {
    if (contractor) {
      setSelectedContractor(contractor);
      setFormData({
        name: contractor.name,
        contractor_id: contractor.contractor_id,
        phone: contractor.phone,
        address: contractor.address
      });
    } else {
      setSelectedContractor(null);
      setFormData({
        name: '',
        contractor_id: '',
        phone: '',
        address: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedContractor(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = {
        name: formData.name,
        contractor_id: formData.contractor_id,
        phone: formData.phone,
        address: formData.address
      };

      if (selectedContractor) {
        await axios.put(`/api/cutting/contractors/${selectedContractor.id}`, submissionData);
      } else {
        await axios.post('/api/cutting/contractors', submissionData);
      }
      fetchContractors();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving cutting contractor:', error);
      alert(error.response?.data?.message || 'Error saving contractor');
    }
  };

  const handleDelete = async (contractorId) => {
    try {
      await axios.delete(`/api/cutting/contractors/${contractorId}`);
      fetchContractors();
    } catch (error) {
      if (error.response?.data?.activeAssignments) {
        const shouldReassign = window.confirm(
          `This contractor has ${error.response.data.assignmentCount} active assignments. Would you like to reassign them to another contractor?`
        );

        if (shouldReassign) {
          setOpenReassignDialog(true);
          setContractorToDelete(contractorId);
        }
      } else if (error.response?.data?.pendingPayments) {
        alert(error.response.data.message);
      } else {
        console.error('Error deleting contractor:', error);
        alert('Error deleting contractor');
      }
    }
  };

  const handleReassignAndDelete = async () => {
    try {
      if (!newContractorId) {
        alert('Please select a new contractor');
        return;
      }

      await axios.delete(`/api/cutting/contractors/${contractorToDelete}?forceDelete=true&newContractorId=${newContractorId}`);
      setOpenReassignDialog(false);
      setContractorToDelete(null);
      setNewContractorId('');
      fetchContractors();
    } catch (error) {
      console.error('Error reassigning and deleting contractor:', error);
      alert(error.response?.data?.message || 'Error reassigning and deleting contractor');
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const startDate = new Date(assignmentFormData.start_date);
      const endDate = new Date(assignmentFormData.end_date);

      if (endDate <= startDate) {
        alert('End date must be after start date');
        return;
      }

      if (!assignmentFormData.contractor_id || !assignmentFormData.land_id ||
          !assignmentFormData.start_date || !assignmentFormData.end_date) {
        alert('Please fill in all required fields');
        return;
      }

      // Remove id from request body
      const { id, ...submitData } = assignmentFormData;

      if (assignmentFormData.id) {
        await axios.put(`/api/cutting/assignments/${assignmentFormData.id}`, submitData);
      } else {
        await axios.post('/api/cutting/assignments', submitData);
      }

      // Refresh both assignments and contractors data
      await Promise.all([
        fetchAssignments(),
        fetchContractors(),
        fetchLands()
      ]);

      setOpenAssignmentDialog(false);
      setAssignmentFormData({
        contractor_id: '',
        land_id: '',
        start_date: '',
        end_date: '',
        status: 'active'
      });
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert(error.response?.data?.message || 'Error saving assignment');
    }
  };

  const handleOpenPaymentDialog = async (contractor) => {
    try {
      await fetchAssignments();

      const contractorAssignments = assignments.filter(
        a => a.contractor_id === contractor.id &&
        (a.status === 'active' || a.status === 'in_progress')
      );

      if (contractorAssignments.length === 0) {
        alert('No active assignments found for this contractor');
        return;
      }

      setPaymentFormData(prev => ({
        ...prev,
        contractor_id: contractor.id,
        assignment_id: contractorAssignments[0]?.id || null,
        notes: `Payment for ${contractor.name}`
      }));
      setOpenPaymentDialog(true);
    } catch (error) {
      console.error('Error preparing payment dialog:', error);
      alert('Error loading contractor assignments');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!paymentFormData.assignment_id) {
        throw new Error('Please select an assignment for this payment');
      }

      if (paymentFormData.id) {
        await axios.put(`/api/cutting/payments/${paymentFormData.id}`, paymentFormData);
      } else {
        await axios.post('/api/cutting/payments', paymentFormData);
      }
      setOpenPaymentDialog(false);
      // Refresh both payment lists and contractors
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments()
      ]);
      setPaymentFormData({
        contractor_id: '',
        assignment_id: null,
        amount: 250,
        companyContribution: 100,
        manufacturingContribution: 150,
        status: 'pending',
        notes: ''
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error.response?.data?.message || error.message || 'Error processing payment');
    }
  };

  const handleOpenCompletionDialog = (item, isAssignment = false) => {
    setSelectedAssignment(item);
    setCompletionFormData({
      assignment_id: isAssignment ? item.id : '',
      raw_item_id: '',
      quantity_received: '',
    });
    setOpenCompletionDialog(true);
  };

  const handleCloseCompletionDialog = () => {
    setOpenCompletionDialog(false);
    setSelectedAssignment(null);
    setCompletionFormData({
      assignment_id: '',
      raw_item_id: '',
      quantity_received: '',
    });
  };

  const handleCompletionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/cutting/assignments/complete', completionFormData);
      handleCloseCompletionDialog();
      // Refresh all relevant data
      await Promise.all([
        fetchAssignments(),
        fetchContractors(),
        fetchInventoryItems(),
        fetchLands()
      ]);
    } catch (error) {
      console.error('Error completing assignment:', error);
      alert(error.response?.data?.message || 'Error completing assignment');
    }
  };

  const summaryStats = {
    total_contractors: contractors.length,
    active_contractors: contractors.filter(c => c.status === 'active').length,
    total_assignments: assignments.length,
    active_assignments: assignments.filter(a => a.status === 'active').length
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenAssignmentDialog = (contractor = null) => {
    // When creating new assignment, fetch only active and unassigned lands
    axios.get('/api/lands?status=active&unassigned=true')
      .then(response => {
        setLands(response.data.filter(land => land.status === 'active'));
        setAssignmentFormData({
          contractor_id: contractor ? contractor.id : '',
          land_id: '',
          start_date: '',
          end_date: '',
          status: 'active'
        });
        setOpenAssignmentDialog(true);
      })
      .catch(error => {
        console.error('Error fetching lands:', error);
        alert('Error loading land data');
      });
  };

  const handleCloseAssignmentDialog = () => {
    setOpenAssignmentDialog(false);
    setAssignmentFormData({
      contractor_id: '',
      land_id: '',
      start_date: '',
      end_date: '',
      status: 'active'
    });
  };

  const handleOpenAdvancePaymentDialog = (contractor) => {
    setAdvancePaymentFormData({
      contractor_id: contractor.id,
      amount: '',
      notes: '',
      status: 'pending'
    });
    setOpenAdvancePaymentDialog(true);
  };

  const handleCloseAdvancePaymentDialog = () => {
    setOpenAdvancePaymentDialog(false);
    setAdvancePaymentFormData({
      contractor_id: '',
      amount: '',
      notes: '',
      status: 'pending'
    });
  };

  const handleAdvancePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (advancePaymentFormData.id) {
        await axios.put(`/api/cutting/advance-payments/${advancePaymentFormData.id}`, advancePaymentFormData);
      } else {
        await axios.post('/api/cutting/advance-payments', advancePaymentFormData);
      }
      handleCloseAdvancePaymentDialog();
      // Refresh both payment lists and contractors
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments()
      ]);
    } catch (error) {
      console.error('Error processing advance payment:', error);
      alert(error.response?.data?.message || 'Error processing advance payment');
    }
  };

  const handleOpenCuttingPaymentDialog = async (item) => {
    try {
      await fetchAssignments();

      const baseFormData = {
        quantity_kg: '',
        price_per_kg: 300,
        total_amount: 0,
        company_contribution: 180,
        manufacturing_contribution: 120,
        notes: '',
        status: 'pending'
      };

      // If item has land_number, it's an assignment
      if (item.land_number) {
        setCuttingPaymentFormData({
          ...baseFormData,
          contractor_id: item.contractor_id,
          assignment_id: item.id,
          isFromAssignment: true
        });
      } else {
        // It's a contractor
        const contractorAssignments = assignments.filter(
          a => a.contractor_id === item.id &&
          ['active', 'in_progress', 'completed'].includes(a.status)
        );

        if (contractorAssignments.length === 0) {
          alert('No active or completed assignments found for this contractor');
          return;
        }

        setCuttingPaymentFormData({
          ...baseFormData,
          contractor_id: item.id,
          assignment_id: '',
          isFromAssignment: false
        });
      }
      setOpenCuttingPaymentDialog(true);
    } catch (error) {
      console.error('Error preparing cutting payment dialog:', error);
      alert('Error loading assignments');
    }
  };

  const handleCloseCuttingPaymentDialog = () => {
    setOpenCuttingPaymentDialog(false);
    setCuttingPaymentFormData({
      contractor_id: '',
      assignment_id: '',
      quantity_kg: '',
      price_per_kg: 300,
      total_amount: 0,
      company_contribution: 180,
      manufacturing_contribution: 120,
      notes: '',
      status: 'pending',
      isFromAssignment: false
    });
  };

  const handleCuttingPaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        contractor_id: Number(cuttingPaymentFormData.contractor_id),
        assignment_id: Number(cuttingPaymentFormData.assignment_id),
        quantity_kg: Number(cuttingPaymentFormData.quantity_kg),
        price_per_kg: Number(cuttingPaymentFormData.price_per_kg),
        amount: Number(cuttingPaymentFormData.total_amount),
        companyContribution: Number(cuttingPaymentFormData.company_contribution),
        manufacturingContribution: Number(cuttingPaymentFormData.manufacturing_contribution),
        notes: cuttingPaymentFormData.notes || null,
        status: cuttingPaymentFormData.status || 'pending'
      };

      await axios.post('/api/cutting/payments', formattedData);
      handleCloseCuttingPaymentDialog();
      // Refresh both payment lists and contractors
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments()
      ]);
    } catch (error) {
      console.error('Error processing cutting payment:', error);
      alert(error.response?.data?.message || 'Error processing cutting payment');
    }
  };

  const calculateContributions = (totalAmount) => {
    const total = parseFloat(totalAmount) || 0;
    const manufacturingRatio = 0.4; // 40% for manufacturing
    const manufacturingContribution = total * manufacturingRatio;
    const companyContribution = total - manufacturingContribution;
    return { companyContribution, manufacturingContribution };
  };

  const handleEditAdvancePayment = (payment) => {
    setAdvancePaymentFormData({
      id: payment.id,
      contractor_id: payment.contractor_id,
      amount: payment.amount,
      notes: payment.notes,
      status: payment.status
    });
    setOpenAdvancePaymentDialog(true);
  };

  const handleEditPayment = (payment) => {
    setPaymentFormData({
      id: payment.id,
      contractor_id: payment.contractor_id,
      assignment_id: payment.assignment_id,
      amount: payment.total_amount,
      companyContribution: payment.company_contribution,
      manufacturingContribution: payment.manufacturing_contribution,
      status: payment.status,
      notes: payment.notes
    });
    setOpenPaymentDialog(true);
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    try {
      await axios.delete(`/api/cutting/payments/${paymentId}`);
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments()
      ]);
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert(error.response?.data?.message || 'Error deleting payment');
    }
  };

  const handleDeleteAdvancePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this advance payment?')) return;

    try {
      await axios.delete(`/api/cutting/advance-payments/${paymentId}`);
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments()
      ]);
    } catch (error) {
      console.error('Error deleting advance payment:', error);
      alert(error.response?.data?.message || 'Error deleting advance payment');
    }
  };

  const handleMarkAdvancePaymentAsPaid = async (paymentId) => {
    try {
      await axios.put(`/api/cutting/advance-payments/${paymentId}/mark-paid`);
      enqueueSnackbar('Advance payment marked as paid', { variant: 'success' });
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments()
      ]);
    } catch (error) {
      console.error('Error marking advance payment as paid:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error marking payment as paid', { variant: 'error' });
    }
  };

  const handleMarkPaymentAsPaid = async (paymentId) => {
    try {
      await axios.put(`/api/cutting/payments/${paymentId}/mark-paid`);
      enqueueSnackbar('Payment marked as paid', { variant: 'success' });
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments()
      ]);
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error marking payment as paid', { variant: 'error' });
    }
  };

  const handleEditAssignment = (assignment) => {
    // Fetch all active lands including the currently assigned one
    axios.get('/api/lands?status=active&includeAssigned=true')
      .then(response => {
        setLands(response.data.filter(land =>
          land.status === 'active' || land.id === assignment.land_id
        ));
        setAssignmentFormData({
          id: assignment.id,
          contractor_id: assignment.contractor_id,
          land_id: assignment.land_id,
          start_date: assignment.start_date.split('T')[0],
          end_date: assignment.end_date.split('T')[0],
          status: assignment.status
        });
        setOpenAssignmentDialog(true);
      })
      .catch(error => {
        console.error('Error fetching lands:', error);
        alert('Error loading land data');
      });
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await axios.delete(`/api/cutting/assignments/${assignmentId}`);
      await Promise.all([
        fetchAssignments(),
        fetchContractors(),
        fetchLands()
      ]);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert(error.response?.data?.message || 'Error deleting assignment');
    }
  };

  const handlePrintPayment = async (payment) => {
    try {
      const settingsResponse = await axios.get('/api/settings');
      const settings = settingsResponse.data;
      const paymentResponse = await axios.get(`/api/cutting/payments/${payment.id}`);
      const paymentDetails = paymentResponse.data;

      const receiptResponse = await axios.post('/api/cutting/payments/receipt', {
        payment: paymentDetails,
        settings: settings
      });

      // Open print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(receiptResponse.data.receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Error printing payment:', error);
      enqueueSnackbar('Error printing payment receipt', { variant: 'error' });
    }
  };

  const handleDeleteContractor = async (contractorId) => {
    if (window.confirm('Are you sure you want to delete this contractor?')) {
      try {
        const response = await axios.delete(`/api/cutting/contractors/${contractorId}`);
        if (response.status === 200) {
          fetchContractors();
        }
      } catch (error) {
        if (error.response?.data?.hasAdvancePayments || error.response?.data?.hasAssignments) {
          setReassignmentData({
            oldContractorId: contractorId,
            newContractorId: '',
            advancePayments: error.response.data.advancePayments || [],
            assignments: error.response.data.assignments || []
          });
          setReassignDialog(true);
        } else {
          console.error('Error deleting contractor:', error);
          alert(error.response?.data?.message || 'Error deleting contractor');
        }
      }
    }
  };

  const handleReassignmentClose = () => {
    setReassignDialog(false);
    setReassignmentData({
      oldContractorId: null,
      newContractorId: '',
      advancePayments: [],
      assignments: []
    });
  };

  const handleReassignmentSubmit = async () => {
    if (!reassignmentData.newContractorId) {
      return;
    }

    try {
      await axios.post(`/api/cutting/contractors/${reassignmentData.oldContractorId}/reassign`, {
        newContractorId: reassignmentData.newContractorId
      });

      // Refresh the data
      await fetchContractors();
      handleReassignmentClose();
    } catch (error) {
      console.error('Error in reassignment:', error);
      alert('Failed to reassign data and delete contractor');
    }
  };

  const ReassignmentDialog = () => (
    <Dialog
      open={reassignDialog}
      onClose={handleReassignmentClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Reassign Contractor Data</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This contractor has active assignments or advance payments. Please select a new contractor to transfer these to before deleting.
          </Alert>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>New Contractor</InputLabel>
            <Select
              value={reassignmentData.newContractorId}
              onChange={(e) => setReassignmentData(prev => ({
                ...prev,
                newContractorId: e.target.value
              }))}
              label="New Contractor"
            >
              {contractors
                .filter(c => c.id !== reassignmentData.oldContractorId)
                .map((contractor) => (
                  <MenuItem key={contractor.id} value={contractor.id}>
                    {contractor.name} ({contractor.contractor_id})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {reassignmentData.assignments.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Active Assignments ({reassignmentData.assignments.length}):
              </Typography>
              <List dense>
                {reassignmentData.assignments.map((assignment) => (
                  <ListItem key={assignment.id}>
                    <ListItemText
                      primary={`Land: ${assignment.land_number}`}
                      secondary={`Start Date: ${new Date(assignment.start_date).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {reassignmentData.advancePayments.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Advance Payments ({reassignmentData.advancePayments.length}):
              </Typography>
              <List dense>
                {reassignmentData.advancePayments.map((payment) => (
                  <ListItem key={payment.id}>
                    <ListItemText
                      primary={`Amount: ${formatCurrency(payment.amount)}`}
                      secondary={`Status: ${payment.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReassignmentClose}>Cancel</Button>
        <Button
          onClick={handleReassignmentSubmit}
          color="primary"
          disabled={!reassignmentData.newContractorId}
        >
          Reassign and Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Cutting Operations
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
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
            onClick={() => setOpenAssignmentDialog(true)}
            color="primary"
          >
            New Operation
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={WorkerIcon}
            title="Active Contractors"
            value={summaryStats.active_contractors}
            iconColor="#9C27B0"
            gradientColor="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={ForestIcon}
            title="Active Operations"
            value={summaryStats.active_assignments}
            iconColor="#D32F2F"
            gradientColor="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AssignmentIcon}
            title="Total Operations"
            value={summaryStats.total_assignments}
            iconColor="#ED6C02"
            gradientColor="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={ContractorsIcon}
            title="Total Contractors"
            value={summaryStats.total_contractors}
            iconColor="#0288D1"
            gradientColor="info"
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab label="Operations" />
          <Tab label="Contractors" />
          <Tab label="Advanced Payments" />
          <Tab label="Payments" />
        </Tabs>

        {/* Operations Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Land Number</TableCell>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id} hover>
                    <TableCell>{assignment.land_number}</TableCell>
                    <TableCell>{assignment.contractor_name}</TableCell>
                    <TableCell>{assignment.location}</TableCell>
                    <TableCell>{new Date(assignment.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(assignment.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.status}
                        color={getStatusColor(assignment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        {assignment.status === 'active' && (
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleOpenCompletionDialog(assignment, true)}
                          >
                            Complete
                          </Button>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenAdvancePaymentDialog({ ...assignment, id: assignment.contractor_id })}
                            sx={{ color: 'warning.main' }}
                            title="Advance Payment"
                          >
                            <MoneyIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenCuttingPaymentDialog(assignment)}
                            sx={{ color: 'info.main' }}
                            title="Cutting Payment"
                          >
                            <PaymentIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditAssignment(assignment)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Contractors Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contractor ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Active Assignments</TableCell>
                  <TableCell>Assigned Lands</TableCell>
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
                    <TableCell>{contractor.active_assignments}</TableCell>
                    <TableCell>
                      {contractor.assigned_lands ? (
                        contractor.assigned_lands.split(',').map((land, index) => (
                          <Chip
                            key={index}
                            label={land}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))
                      ) : (
                        'None'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contractor.status}
                        color={contractor.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          size="small"
                          color="success"
                          onClick={() => handleOpenAssignmentDialog(contractor)}
                        >
                          Assign
                        </Button>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenAdvancePaymentDialog(contractor)}
                            sx={{ color: 'warning.main' }}
                            title="Advance Payment"
                          >
                            <MoneyIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenCuttingPaymentDialog(contractor)}
                            sx={{ color: 'info.main' }}
                            title="Cutting Payment"
                          >
                            <PaymentIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(contractor)}
                            sx={{ color: 'primary.main' }}
                            title="Edit"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteContractor(contractor.id)}
                            sx={{ color: 'error.main' }}
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Advanced Payments Tab */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {advancePayments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{payment.contractor_name}</TableCell>
                    <TableCell>{formatCurrency(payment.amount, false)}</TableCell>
                    <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.notes}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        color={
                          payment.status === 'paid' ? 'success' :
                          payment.status === 'approved' ? 'info' :
                          payment.status === 'pending' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        {payment.status !== 'paid' && (
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleMarkAdvancePaymentAsPaid(payment.id)}
                          >
                            Paid
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleEditAdvancePayment(payment)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAdvancePayment(payment.id)}
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
        </TabPanel>

        {/* Payments Tab */}
        <TabPanel value={tabValue} index={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Receipt Number</TableCell>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Company Contribution</TableCell>
                  <TableCell>Manufacturing Contribution</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{payment.receipt_number}</TableCell>
                    <TableCell>{payment.contractor_name}</TableCell>
                    <TableCell>{formatCurrency(payment.total_amount, false)}</TableCell>
                    <TableCell>{formatCurrency(payment.company_contribution, false)}</TableCell>
                    <TableCell>{formatCurrency(payment.manufacturing_contribution, false)}</TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.notes}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        color={payment.status === 'paid' ? 'success' : payment.status === 'pending' ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        {payment.status !== 'paid' && (
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleMarkPaymentAsPaid(payment.id)}
                          >
                            Paid
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handlePrintPayment(payment)}
                          sx={{ color: 'success.main' }}
                        >
                          <PrintIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPayment(payment)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePayment(payment.id)}
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
        </TabPanel>
      </Paper>

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
          <Button variant="contained" onClick={handleSubmit}>
            {selectedContractor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAssignmentDialog} onClose={handleCloseAssignmentDialog}>
        <DialogTitle>
          {assignmentFormData.contractor_id
            ? `Assign Land to ${contractors.find(c => c.id === assignmentFormData.contractor_id)?.name}`
            : 'Assign Land to Contractor'
          }
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {!assignmentFormData.contractor_id && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Contractor</InputLabel>
                  <Select
                    name="contractor_id"
                    value={assignmentFormData.contractor_id}
                    label="Contractor"
                    onChange={(e) => setAssignmentFormData(prev => ({
                      ...prev,
                      contractor_id: e.target.value
                    }))}
                  >
                    {contractors
                      .filter(c => c.status === 'active')
                      .map(contractor => (
                        <MenuItem key={contractor.id} value={contractor.id}>
                          {contractor.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Land</InputLabel>
                <Select
                  name="land_id"
                  value={assignmentFormData.land_id}
                  label="Land"
                  onChange={(e) => setAssignmentFormData(prev => ({
                    ...prev,
                    land_id: e.target.value
                  }))}
                >
                  {lands.map(land => (
                    <MenuItem key={land.id} value={land.id}>
                      {land.name} ({land.land_number}) - {land.location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                name="start_date"
                value={assignmentFormData.start_date}
                onChange={(e) => setAssignmentFormData(prev => ({
                  ...prev,
                  start_date: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                name="end_date"
                value={assignmentFormData.end_date}
                onChange={(e) => setAssignmentFormData(prev => ({
                  ...prev,
                  end_date: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignmentDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignmentSubmit}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Process Cutting Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Assignment</InputLabel>
                <Select
                  value={paymentFormData.assignment_id || ''}
                  label="Assignment*"
                  onChange={(e) => setPaymentFormData(prev => ({
                    ...prev,
                    assignment_id: e.target.value
                  }))}
                >
                  {assignments
                    .filter(a =>
                      a.contractor_id === paymentFormData.contractor_id &&
                      ['active', 'in_progress', 'completed'].includes(a.status)
                    )
                    .map(assignment => (
                      <MenuItem key={assignment.id} value={assignment.id}>
                        {`Land ${assignment.land_number} - ${assignment.location} (${assignment.status})`}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Amount"
                type="number"
                value={paymentFormData.amount}
                onChange={(e) => setPaymentFormData(prev => ({
                  ...prev,
                  amount: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Contribution"
                type="number"
                value={paymentFormData.companyContribution}
                onChange={(e) => setPaymentFormData(prev => ({
                  ...prev,
                  companyContribution: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturing Contribution"
                type="number"
                value={paymentFormData.manufacturingContribution}
                onChange={(e) => setPaymentFormData(prev => ({
                  ...prev,
                  manufacturingContribution: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={paymentFormData.status}
                  label="Status"
                  onChange={(e) => setPaymentFormData(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="due">Due</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={paymentFormData.notes}
                onChange={(e) => setPaymentFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePaymentSubmit}
            disabled={!paymentFormData.assignment_id}
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReassignDialog} onClose={() => {
        setOpenReassignDialog(false);
        setContractorToDelete(null);
        setNewContractorId('');
      }}>
        <DialogTitle>Reassign Assignments</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select New Contractor</InputLabel>
            <Select
              value={newContractorId}
              onChange={(e) => setNewContractorId(e.target.value)}
              label="Select New Contractor"
            >
              {contractors
                .filter(c => c.id !== contractorToDelete && c.status === 'active')
                .map(contractor => (
                  <MenuItem key={contractor.id} value={contractor.id}>
                    {contractor.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenReassignDialog(false);
            setContractorToDelete(null);
            setNewContractorId('');
          }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleReassignAndDelete}>
            Reassign & Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCompletionDialog} onClose={handleCloseCompletionDialog}>
        <DialogTitle>
          {selectedAssignment ? (
            completionFormData.assignment_id
              ? `Complete Assignment - Land ${selectedAssignment.land_number}`
              : `Complete Assignment for ${selectedAssignment.name || selectedAssignment.contractor_name}`
          ) : 'Complete Assignment'
          }
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCompletionSubmit} sx={{ mt: 2 }}>
            {!completionFormData.assignment_id && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Assignment</InputLabel>
                <Select
                  value={completionFormData.assignment_id}
                  onChange={(e) =>
                    setCompletionFormData({
                      ...completionFormData,
                      assignment_id: e.target.value,
                    })
                  }
                >
                  {assignments
                    .filter(a =>
                      a.contractor_id === selectedAssignment?.id &&
                      a.status === 'active'
                    )
                    .map((assignment) => (
                      <MenuItem key={assignment.id} value={assignment.id}>
                        Land {assignment.land_number} - {assignment.location}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Raw Material</InputLabel>
              <Select
                value={completionFormData.raw_item_id}
                onChange={(e) =>
                  setCompletionFormData({
                    ...completionFormData,
                    raw_item_id: e.target.value,
                  })
                }
              >
                {inventoryItems.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.product_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Quantity Received (kg)"
              type="number"
              value={completionFormData.quantity_received}
              onChange={(e) =>
                setCompletionFormData({
                  ...completionFormData,
                  quantity_received: e.target.value,
                })
              }
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompletionDialog}>Cancel</Button>
          <Button
            onClick={handleCompletionSubmit}
            variant="contained"
            disabled={!completionFormData.assignment_id || !completionFormData.raw_item_id || !completionFormData.quantity_received}
          >
            Complete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAdvancePaymentDialog} onClose={handleCloseAdvancePaymentDialog}>
        <DialogTitle>Process Advance Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={advancePaymentFormData.amount}
                onChange={(e) => setAdvancePaymentFormData(prev => ({
                  ...prev,
                  amount: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={advancePaymentFormData.notes}
                onChange={(e) => setAdvancePaymentFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdvancePaymentDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdvancePaymentSubmit}
            disabled={!advancePaymentFormData.amount}
          >
            Process Advance
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCuttingPaymentDialog} onClose={handleCloseCuttingPaymentDialog}>
        <DialogTitle>Process Cutting Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {!cuttingPaymentFormData.isFromAssignment && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Assignment</InputLabel>
                  <Select
                    value={cuttingPaymentFormData.assignment_id || ''}
                    label="Assignment"
                    onChange={(e) => setCuttingPaymentFormData(prev => ({
                      ...prev,
                      assignment_id: e.target.value
                    }))}
                  >
                    {assignments
                      .filter(a =>
                        a.contractor_id === cuttingPaymentFormData.contractor_id &&
                        ['active', 'in_progress', 'completed'].includes(a.status)
                      )
                      .map(assignment => (
                        <MenuItem key={assignment.id} value={assignment.id}>
                          {`Land ${assignment.land_number} - ${assignment.location} (${assignment.status})`}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity (kg)"
                type="number"
                value={cuttingPaymentFormData.quantity_kg}
                onChange={(e) => {
                  const quantity = e.target.value;
                  const total = quantity * cuttingPaymentFormData.price_per_kg;
                  const { companyContribution, manufacturingContribution } = calculateContributions(total);
                  setCuttingPaymentFormData(prev => ({
                    ...prev,
                    quantity_kg: quantity,
                    total_amount: total,
                    company_contribution: companyContribution,
                    manufacturing_contribution: manufacturingContribution
                  }));
                }}
                required
                helperText={`Total Charge: ${formatCurrency(cuttingPaymentFormData.quantity_kg * cuttingPaymentFormData.price_per_kg, false)}`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Charge per kg"
                type="number"
                value={cuttingPaymentFormData.price_per_kg}
                onChange={(e) => {
                  const chargePerKg = e.target.value;
                  const total = cuttingPaymentFormData.quantity_kg * chargePerKg;
                  const { companyContribution, manufacturingContribution } = calculateContributions(total);
                  setCuttingPaymentFormData(prev => ({
                    ...prev,
                    price_per_kg: chargePerKg,
                    total_amount: total,
                    company_contribution: companyContribution,
                    manufacturing_contribution: manufacturingContribution
                  }));
                }}
                required
                helperText={`Current: ${formatCurrency(cuttingPaymentFormData.price_per_kg, false)}/kg`}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Amount"
                type="number"
                value={cuttingPaymentFormData.total_amount}
                onChange={(e) => {
                  const total = e.target.value;
                  const { companyContribution, manufacturingContribution } = calculateContributions(total);
                  setCuttingPaymentFormData(prev => ({
                    ...prev,
                    total_amount: total,
                    company_contribution: companyContribution,
                    manufacturing_contribution: manufacturingContribution
                  }));
                }}
                required
                helperText={`Calculated Amount: ${formatCurrency(cuttingPaymentFormData.total_amount, false)}`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Contribution"
                type="number"
                value={cuttingPaymentFormData.company_contribution}
                onChange={(e) => {
                  const newCompanyContribution = parseFloat(e.target.value) || 0;
                  const totalAmount = parseFloat(cuttingPaymentFormData.total_amount) || 0;
                  const newManufacturingContribution = totalAmount - newCompanyContribution;

                  if (newManufacturingContribution >= 0) {
                    setCuttingPaymentFormData(prev => ({
                      ...prev,
                      company_contribution: newCompanyContribution,
                      manufacturing_contribution: newManufacturingContribution
                    }));
                  }
                }}
                helperText={`Current: ${formatCurrency(cuttingPaymentFormData.company_contribution, false)}`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturing Contribution"
                type="number"
                value={cuttingPaymentFormData.manufacturing_contribution}
                onChange={(e) => {
                  const newManufacturingContribution = parseFloat(e.target.value) || 0;
                  const totalAmount = parseFloat(cuttingPaymentFormData.total_amount) || 0;
                  const newCompanyContribution = totalAmount - newManufacturingContribution;

                  if (newCompanyContribution >= 0) {
                    setCuttingPaymentFormData(prev => ({
                      ...prev,
                      manufacturing_contribution: newManufacturingContribution,
                      company_contribution: newCompanyContribution
                    }));
                  }
                }}
                helperText={`Current: ${formatCurrency(cuttingPaymentFormData.manufacturing_contribution, false)}`}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={cuttingPaymentFormData.notes}
                onChange={(e) => setCuttingPaymentFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCuttingPaymentDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCuttingPaymentSubmit}
            disabled={!cuttingPaymentFormData.assignment_id || !cuttingPaymentFormData.quantity_kg || !cuttingPaymentFormData.total_amount}
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      <ReassignmentDialog />
    </Box>
  );
};

export default CuttingManagement;