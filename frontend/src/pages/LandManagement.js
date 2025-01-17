import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Terrain as TerrainIcon,
  Home as OwnedIcon,
  Assignment as RentedIcon,
  Agriculture as AreaIcon,
  Assessment as AssessmentIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { getLands, deleteLand } from '../features/lands/landSlice';
import LandForm from '../components/lands/LandForm';
import LandCategoryManager from '../components/lands/LandCategoryManager';
import SummaryCard from '../components/common/SummaryCard';
import axios from 'axios';

const CategoryDialog = ({
  open,
  onClose,
  selectedCategory,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: selectedCategory?.name || '',
    description: selectedCategory?.description || '',
    status: selectedCategory?.status || 'active'
  });

  useEffect(() => {
    if (selectedCategory) {
      setFormData({
        name: selectedCategory.name,
        description: selectedCategory.description || '',
        status: selectedCategory.status
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'active'
      });
    }
  }, [selectedCategory]);

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {selectedCategory ? 'Edit Category' : 'New Category'}
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
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {selectedCategory ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ReassignmentDialog = ({
  open,
  onClose,
  reassignmentData,
  categories,
  onReassign,
  oldCategoryId,
  onCategoryChange
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle>Reassign Lands</DialogTitle>
    <DialogContent>
      <Box sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          This category has lands assigned to it. Please select a new category for these lands before deleting.
        </Alert>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>New Category</InputLabel>
          <Select
            value={reassignmentData.newCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            label="New Category"
          >
            {categories
              .filter(c => c.id !== oldCategoryId)
              .map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Affected Lands ({reassignmentData.affectedLands.length}):
        </Typography>
        <List dense>
          {reassignmentData.affectedLands.map((land) => (
            <ListItem key={land.id}>
              <ListItemText
                primary={land.name}
                secondary={`${land.land_number} - ${land.size} ha`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button
        onClick={() => onReassign(reassignmentData.newCategoryId)}
        color="primary"
        disabled={!reassignmentData.newCategoryId}
      >
        Reassign and Delete
      </Button>
    </DialogActions>
  </Dialog>
);

const LandManagement = () => {
  const dispatch = useDispatch();
  const { lands, isLoading } = useSelector((state) => state.lands);
  const { user } = useSelector((state) => state.auth);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLand, setSelectedLand] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [landReports, setLandReports] = useState([]);
  const [landReport, setLandReport] = useState(null);
  const [landReportDialog, setLandReportDialog] = useState(false);
  const [selectedLandReport, setSelectedLandReport] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [reassignmentData, setReassignmentData] = useState({
    oldCategoryId: null,
    newCategoryId: '',
    affectedLands: []
  });
  const [reassignDialog, setReassignDialog] = useState(false);
  const [filters, setFilters] = useState({
    landId: '',
    startDate: null,
    endDate: null,
    minCuttings: '',
    maxCuttings: '',
    minTasks: '',
    maxTasks: '',
    contractorId: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    dispatch(getLands());
    fetchCategories();
  }, [dispatch, user, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/land-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpenCategoryDialog = (category = null) => {
    setSelectedCategory(category);
    setCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialog(false);
    setSelectedCategory(null);
  };

  const handleCategorySubmit = async (formData) => {
    try {
      if (selectedCategory) {
        await axios.put(`/api/land-categories/${selectedCategory.id}`, formData);
      } else {
        await axios.post('/api/land-categories', formData);
      }
      await fetchCategories();
      handleCloseCategoryDialog();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`/api/land-categories/${id}`);
        await fetchCategories();
      } catch (error) {
        if (error.response?.status === 400) {
          // Get only the lands using this category
          const landsResponse = await axios.get(`/api/lands`, {
            params: {
              category_id: id
            }
          });
          setReassignmentData({
            oldCategoryId: id,
            newCategoryId: '',
            affectedLands: landsResponse.data.filter(land => land.category_id === id)
          });
          setReassignDialog(true);
        } else {
          console.error('Error deleting category:', error);
          alert('Failed to delete category');
        }
      }
    }
  };

  const handleReassignmentClose = () => {
    setReassignDialog(false);
    setReassignmentData({
      oldCategoryId: null,
      newCategoryId: '',
      affectedLands: []
    });
  };

  const handleReassignmentSubmit = async () => {
    if (!reassignmentData.newCategoryId) {
      return;
    }

    try {
      // Single API call to reassign lands and delete category
      await axios.post(`/api/land-categories/${reassignmentData.oldCategoryId}/reassign`, {
        newCategoryId: reassignmentData.newCategoryId
      });

      // Refresh the data
      await fetchCategories();
      dispatch(getLands());
      handleReassignmentClose();
    } catch (error) {
      console.error('Error in reassignment:', error);
      alert('Failed to reassign lands and delete category');
    }
  };

  useEffect(() => {
    if (activeTab === 2) {
      fetchLandReports();
    }
  }, [filters, activeTab]);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const response = await axios.get('/api/reports/cutting-contractors');
        setContractors(response.data);
      } catch (error) {
        console.error('Error fetching contractors:', error);
      }
    };
    fetchFilterData();
  }, []);

  const fetchLandReports = async () => {
    try {
      let url = '/api/lands/reports?';
      const params = new URLSearchParams();

      if (filters.landId) {
        params.append('landId', filters.landId);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.minCuttings) {
        params.append('minCuttings', filters.minCuttings);
      }
      if (filters.maxCuttings) {
        params.append('maxCuttings', filters.maxCuttings);
      }
      if (filters.minTasks) {
        params.append('minTasks', filters.minTasks);
      }
      if (filters.maxTasks) {
        params.append('maxTasks', filters.maxTasks);
      }
      if (filters.contractorId) {
        params.append('contractorId', filters.contractorId);
      }

      const response = await axios.get(`${url}${params.toString()}`);
      setLandReports(response.data);
    } catch (error) {
      console.error('Error fetching land reports:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilter = (fieldName) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: fieldName.includes('date') ? null : ''
    }));
  };

  const handleEdit = (land) => {
    setSelectedLand(land);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLand(null);
    dispatch(getLands());
  };

  const handleDelete = async (landId) => {
    if (window.confirm('Are you sure you want to delete this land?')) {
      try {
        await dispatch(deleteLand(landId)).unwrap();
      } catch (error) {
        console.error('Error deleting land:', error);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenLandReport = async (land) => {
    setSelectedLandReport(land);
    try {
      const response = await axios.get(`/api/lands/${land.id}/report`);
      setLandReport(response.data);
      setLandReportDialog(true);
    } catch (error) {
      console.error('Error fetching land report:', error);
    }
  };

  const handleCloseLandReport = () => {
    setLandReportDialog(false);
    setSelectedLandReport(null);
    setLandReport(null);
  };

  // Calculate summary statistics
  const summaryStats = {
    totalLands: lands.length,
    ownedLands: lands.filter(land => land.ownership_status === 'owned').length,
    rentedLands: lands.filter(land => land.ownership_status === 'rent').length,
    totalArea: lands.reduce((sum, land) => sum + Number(land.size), 0),
    categoryCounts: lands.reduce((acc, land) => {
      acc[land.category] = (acc[land.category] || 0) + 1;
      return acc;
    }, {})
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'warning';
    }
  };

  const handleReassignmentCategoryChange = (newCategoryId) => {
    setReassignmentData(prev => ({
      ...prev,
      newCategoryId
    }));
  };

  const LandReportDialog = () => (
    <Dialog
      open={landReportDialog}
      onClose={handleCloseLandReport}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {selectedLandReport?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {selectedLandReport?.land_number} • {selectedLandReport?.location}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
            <Chip
              label={selectedLandReport?.status.replace(/_/g, ' ').toUpperCase()}
              color={getStatusColor(selectedLandReport?.status)}
              size="small"
            />
            <Chip
              label={selectedLandReport?.category_name.toUpperCase()}
              color={
                selectedLandReport?.category_name === 'Agricultural' ? 'success' :
                selectedLandReport?.category_name === 'Residential' ? 'primary' :
                selectedLandReport?.category_name === 'Commercial' ? 'warning' :
                selectedLandReport?.category_name === 'Forest' ? 'success' : 'default'
              }
              size="small"
            />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {selectedLandReport && (
          <Box>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="Total Size"
                  value={`${Number(selectedLandReport.size).toFixed(1)} ha`}
                  icon={TerrainIcon}
                  iconColor="success.main"
                  gradientColor="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="Area Covered"
                  value={selectedLandReport.total_area_covered ? `${Number(selectedLandReport.total_area_covered).toFixed(1)} ha` : '0 ha'}
                  icon={AreaIcon}
                  iconColor="warning.main"
                  gradientColor="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="Total Cuttings"
                  value={selectedLandReport.total_cuttings || 0}
                  icon={TerrainIcon}
                  iconColor="info.main"
                  gradientColor="info"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <SummaryCard
                  title="Active Contractors"
                  value={selectedLandReport.total_contractors || 0}
                  icon={AssessmentIcon}
                  iconColor="primary.main"
                  gradientColor="primary"
                />
              </Grid>
            </Grid>

            {/* Main Content Grid */}
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                {/* Description Card */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Description
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {selectedLandReport.description || 'No description provided'}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Acquisition Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedLandReport.acquisition_date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedLandReport.updated_at).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Contractors Card */}
                <Paper sx={{ p: 2, mb: { xs: 3, md: 0 } }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Active Contractors
                  </Typography>
                  {selectedLandReport.contractors?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedLandReport.contractors.map((contractor, index) => (
                        <Chip
                          key={index}
                          label={contractor.name}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography color="text.secondary">
                      No active contractors assigned
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={6}>
                {/* Ownership Details */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Ownership Details
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedLandReport.ownership_status.toUpperCase()}
                      color={selectedLandReport.ownership_status === 'owned' ? 'success' : 'warning'}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  {selectedLandReport.rent_details && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Lessor
                          </Typography>
                          <Typography variant="body1">
                            {selectedLandReport.rent_details.lessor_name}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Monthly Rent
                          </Typography>
                          <Typography variant="body1">
                            ${selectedLandReport.rent_details.monthly_rent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Contact
                          </Typography>
                          <Typography variant="body1">
                            {selectedLandReport.rent_details.lessor_contact}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Lease Period
                          </Typography>
                          <Typography variant="body1">
                            {new Date(selectedLandReport.rent_details.lease_start_date).toLocaleDateString()} - {new Date(selectedLandReport.rent_details.lease_end_date).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </>
                  )}
                </Paper>

                {/* Cutting History */}
                {selectedLandReport.cutting_history && selectedLandReport.cutting_history.length > 0 && (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Recent Cutting History
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Contractor</TableCell>
                          <TableCell align="right">Area</TableCell>
                          <TableCell align="right">Progress</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedLandReport.cutting_history.map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                            <TableCell>{entry.contractor_name}</TableCell>
                            <TableCell align="right">{entry.area_covered} ha</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${entry.progress}%`}
                                color={entry.progress >= 100 ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: 3, py: 2 }}>
        <Button onClick={handleCloseLandReport} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Land Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCategoryDialog()}
          >
            New Category
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Land
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={TerrainIcon}
            title="Total Lands"
            value={summaryStats.totalLands}
            iconColor="#9C27B0"
            gradientColor="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={OwnedIcon}
            title="Owned Lands"
            value={summaryStats.ownedLands}
            iconColor="#D32F2F"
            gradientColor="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={RentedIcon}
            title="Rented Lands"
            value={summaryStats.rentedLands}
            iconColor="#ED6C02"
            gradientColor="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AreaIcon}
            title="Total Area"
            value={`${summaryStats.totalArea.toFixed(2)} ha`}
            iconColor="#0288D1"
            gradientColor="info"
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab label="Lands" />
          <Tab label="Categories" />
          <Tab label="Reports" />
        </Tabs>

        {/* Lands Tab Content */}
        {activeTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Land Number</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Ownership</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lands.map((land) => (
                  <TableRow key={land.id} hover>
                    <TableCell>{land.name}</TableCell>
                    <TableCell>{land.land_number}</TableCell>
                    <TableCell>{land.size} ha</TableCell>
                    <TableCell>
                      <Chip
                        label={land.category_name}
                        color={
                          land.category_name === 'Agricultural' ? 'success' :
                          land.category_name === 'Residential' ? 'primary' :
                          land.category_name === 'Commercial' ? 'warning' :
                          land.category_name === 'Forest' ? 'success' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={land.ownership_status}
                        color={land.ownership_status === 'owned' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{land.location}</TableCell>
                    <TableCell>
                      <Chip
                        label={land.status}
                        color={getStatusColor(land.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(land)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(land.id)}
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

        {/* Categories Tab Content */}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Land Count</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={category.status.toUpperCase()}
                        color={category.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{category.land_count}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenCategoryDialog(category)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCategory(category.id)}
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

        {/* Reports Tab Content */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            {/* Filters Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                {/* First Row */}
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Land</InputLabel>
                    <Select
                      value={filters.landId}
                      label="Land"
                      onChange={(e) => handleFilterChange('landId', e.target.value)}
                      endAdornment={
                        filters.landId && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() => handleClearFilter('landId')}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>All Lands</em>
                      </MenuItem>
                      {lands.map((land) => (
                        <MenuItem key={land.id} value={land.id}>
                          {land.name}
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
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: filters.startDate && (
                        <IconButton
                          size="small"
                          onClick={() => handleClearFilter('startDate')}
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
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: filters.endDate && (
                        <IconButton
                          size="small"
                          onClick={() => handleClearFilter('endDate')}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                      inputProps: {
                        min: filters.startDate || undefined
                      }
                    }}
                  />
                </Grid>

                {/* Second Row */}
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Contractor</InputLabel>
                    <Select
                      value={filters.contractorId}
                      label="Contractor"
                      onChange={(e) => handleFilterChange('contractorId', e.target.value)}
                      endAdornment={
                        filters.contractorId && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() => handleClearFilter('contractorId')}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>All Contractors</em>
                      </MenuItem>
                      {contractors.map((contractor) => (
                        <MenuItem key={contractor.value} value={contractor.value}>
                          {contractor.label.en}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Min Cuttings"
                        type="number"
                        value={filters.minCuttings}
                        onChange={(e) => handleFilterChange('minCuttings', e.target.value)}
                        InputProps={{
                          inputProps: { min: 0 },
                          endAdornment: filters.minCuttings && (
                            <IconButton
                              size="small"
                              onClick={() => handleClearFilter('minCuttings')}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Max Cuttings"
                        type="number"
                        value={filters.maxCuttings}
                        onChange={(e) => handleFilterChange('maxCuttings', e.target.value)}
                        InputProps={{
                          inputProps: { min: 0 },
                          endAdornment: filters.maxCuttings && (
                            <IconButton
                              size="small"
                              onClick={() => handleClearFilter('maxCuttings')}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Min Tasks"
                        type="number"
                        value={filters.minTasks}
                        onChange={(e) => handleFilterChange('minTasks', e.target.value)}
                        InputProps={{
                          inputProps: { min: 0 },
                          endAdornment: filters.minTasks && (
                            <IconButton
                              size="small"
                              onClick={() => handleClearFilter('minTasks')}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Max Tasks"
                        type="number"
                        value={filters.maxTasks}
                        onChange={(e) => handleFilterChange('maxTasks', e.target.value)}
                        InputProps={{
                          inputProps: { min: 0 },
                          endAdornment: filters.maxTasks && (
                            <IconButton
                              size="small"
                              onClick={() => handleClearFilter('maxTasks')}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>

            {/* Reports Grid */}
            <Grid container spacing={3}>
              {landReports.map((land) => (
                <Grid item xs={12} md={6} lg={4} key={land.id}>
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
                    onClick={() => handleOpenLandReport(land)}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {land.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {land.description}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Status
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={land.status.replace(/_/g, ' ').toUpperCase()}
                            color={getStatusColor(land.status)}
                            size="small"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Category
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={land.category_name.toUpperCase()}
                            color={
                              land.category_name === 'Agricultural' ? 'success' :
                              land.category_name === 'Residential' ? 'primary' :
                              land.category_name === 'Commercial' ? 'warning' :
                              land.category_name === 'Forest' ? 'success' : 'default'
                            }
                            size="small"
                          />
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Size & Coverage
                      </Typography>
                      <Typography variant="body2">
                        {Number(land.size).toFixed(1)} ha total • {land.total_area_covered ? `${Number(land.total_area_covered).toFixed(1)} ha covered` : 'No area covered'}
                      </Typography>
                    </Box>

                    {land.contractors?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Active Contractors
                        </Typography>
                        <Typography variant="body2">
                          {land.contractors.map(c => c.name).join(', ')}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AssessmentIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLandReport(land);
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

      {/* Land Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{selectedLand ? 'Edit Land' : 'New Land'}</DialogTitle>
        <DialogContent>
          <LandForm
            land={selectedLand}
            onClose={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      <LandReportDialog />
      <CategoryDialog
        open={categoryDialog}
        onClose={handleCloseCategoryDialog}
        selectedCategory={selectedCategory}
        onSubmit={handleCategorySubmit}
      />
      <ReassignmentDialog
        open={reassignDialog}
        onClose={handleReassignmentClose}
        reassignmentData={reassignmentData}
        categories={categories}
        onReassign={handleReassignmentSubmit}
        oldCategoryId={reassignmentData.oldCategoryId}
        onCategoryChange={handleReassignmentCategoryChange}
      />
    </Box>
  );
};

export default LandManagement;