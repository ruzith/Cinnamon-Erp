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
} from '@mui/icons-material';
import axios from 'axios';
import SummaryCard from '../components/common/SummaryCard';

const CuttingManagement = () => {
  const [contractors, setContractors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contractor_id: '',
    phone: '',
    status: 'active'
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

  useEffect(() => {
    fetchContractors();
    fetchAssignments();
    fetchLands();
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
      const activeAssignments = response.data.filter(a => a.status === 'active' || a.status === 'in_progress');
      setAssignments(activeAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchLands = async () => {
    try {
      const response = await axios.get('/api/lands');
      setLands(response.data);
    } catch (error) {
      console.error('Error fetching lands:', error);
    }
  };

  const handleOpenDialog = (contractor = null) => {
    if (contractor) {
      setSelectedContractor(contractor);
      setFormData({
        name: contractor.name,
        contractor_id: contractor.contractor_id,
        phone: contractor.phone,
        status: contractor.status
      });
    } else {
      setSelectedContractor(null);
      setFormData({
        name: '',
        contractor_id: '',
        phone: '',
        status: 'active'
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
      if (selectedContractor) {
        await axios.put(`/api/cutting/contractors/${selectedContractor.id}`, formData);
      } else {
        await axios.post('/api/cutting/contractors', formData);
      }
      fetchContractors();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving cutting contractor:', error);
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

      await axios.post('/api/cutting/assignments', assignmentFormData);

      // Refresh both assignments and contractors data
      await Promise.all([
        fetchAssignments(),
        fetchContractors()
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
      console.error('Error creating assignment:', error);
      alert(error.response?.data?.message || 'Error creating assignment');
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

      await axios.post('/api/cutting/payments', paymentFormData);
      fetchContractors();
      setOpenPaymentDialog(false);
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

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Cutting Operations
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ForestIcon />}
            onClick={() => setOpenAssignmentDialog(true)}
          >
            Assign Land
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Cutting Operation
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
            title="Active Assignments"
            value={summaryStats.active_assignments}
            iconColor="#D32F2F"
            gradientColor="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AssignmentIcon}
            title="Total Assignments"
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
                  <TableCell>{contractor.active_assignments || 0}</TableCell>
                  <TableCell>{contractor.assigned_lands || 'None'}</TableCell>
                  <TableCell>
                    <Chip
                      label={contractor.status}
                      color={contractor.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setAssignmentFormData(prev => ({
                          ...prev,
                          contractor_id: contractor.id
                        }));
                        setOpenAssignmentDialog(true);
                      }}
                      sx={{ color: 'success.main' }}
                    >
                      <ForestIcon />
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
                      onClick={() => handleOpenDialog(contractor)}
                      sx={{ color: 'primary.main', ml: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(contractor.id)}
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
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedContractor ? 'Edit Cutting Contractor' : 'New Cutting Contractor'}
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
                helperText="Unique identifier for the contractor"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleInputChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
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

      <Dialog open={openAssignmentDialog} onClose={() => setOpenAssignmentDialog(false)}>
        <DialogTitle>Assign Land to Contractor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                  required
                >
                  {contractors.map(contractor => (
                    <MenuItem key={contractor.id} value={contractor.id}>
                      {contractor.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
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
                  required
                >
                  {lands.map(land => (
                    <MenuItem key={land.id} value={land.id}>
                      {land.name} ({land.land_number})
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
                required
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
                      (a.status === 'active' || a.status === 'in_progress')
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
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Contribution"
                type="number"
                value={paymentFormData.companyContribution}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturing Contribution"
                type="number"
                value={paymentFormData.manufacturingContribution}
                disabled
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
    </Box>
  );
};

export default CuttingManagement;