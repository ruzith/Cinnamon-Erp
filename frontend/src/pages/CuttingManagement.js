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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Forest as ForestIcon,
  LocalFlorist as TreeIcon,
  Engineering as WorkerIcon,
  Speed as VolumeIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import axios from 'axios';

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
    amount: 250,
    companyContribution: 100,
    manufacturingContribution: 150,
    status: 'pending',
    notes: ''
  });

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
      setAssignments(response.data);
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
    if (window.confirm('Are you sure you want to delete this cutting operation?')) {
      try {
        await axios.delete(`/api/cutting/contractors/${contractorId}`);
        fetchContractors();
      } catch (error) {
        console.error('Error deleting cutting operation:', error);
      }
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
      fetchAssignments();
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

  const handleOpenPaymentDialog = (contractor) => {
    setPaymentFormData(prev => ({
      ...prev,
      contractor_id: contractor.id,
      notes: `Payment for ${contractor.name}`
    }));
    setOpenPaymentDialog(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/cutting/payments', paymentFormData);
      fetchContractors();
      setOpenPaymentDialog(false);
      setPaymentFormData({
        contractor_id: '',
        amount: 250,
        companyContribution: 100,
        manufacturingContribution: 150,
        status: 'pending',
        notes: ''
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error.response?.data?.message || 'Error processing payment');
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
            startIcon={<TreeIcon />}
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
              <ForestIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="textSecondary">Total Contractors</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.total_contractors}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(46, 125, 50, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WorkerIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography color="textSecondary">Active Contractors</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.active_contractors}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(251, 140, 0, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TreeIcon sx={{ color: 'warning.main', mr: 1 }} />
              <Typography color="textSecondary">Total Assignments</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.total_assignments}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(2, 136, 209, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VolumeIcon sx={{ color: 'info.main', mr: 1 }} />
              <Typography color="textSecondary">Active Assignments</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.active_assignments}</Typography>
          </Paper>
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
                      <TreeIcon />
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
                      {land.name} ({land.parcel_number})
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
          <Button variant="contained" onClick={handlePaymentSubmit}>
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CuttingManagement; 