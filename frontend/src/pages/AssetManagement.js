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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  Timeline as TimelineIcon,
  Inventory as AssetIcon,
  Warning as AlertIcon,
  Engineering as MaintenanceIcon,
  AttachMoney as ValueIcon,
} from '@mui/icons-material';
import axios from 'axios';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const AssetManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [assets, setAssets] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [assetFormData, setAssetFormData] = useState({
    assetNumber: '',
    name: '',
    category: '',
    type: '',
    manufacturer: '',
    model: '',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    location: '',
    status: 'active',
    assignedTo: '',
    specifications: '',
    warrantyInfo: '',
    notes: ''
  });

  const [maintenanceFormData, setMaintenanceFormData] = useState({
    assetId: '',
    type: 'routine',
    description: '',
    date: '',
    cost: '',
    performedBy: '',
    nextMaintenanceDate: '',
    status: 'completed',
    notes: ''
  });

  useEffect(() => {
    fetchAssets();
    fetchMaintenanceRecords();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchMaintenanceRecords = async () => {
    try {
      const response = await axios.get('/api/assets/maintenance');
      setMaintenanceRecords(response.data);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (asset = null) => {
    if (asset) {
      setSelectedAsset(asset);
      setAssetFormData({
        assetNumber: asset.assetNumber,
        name: asset.name,
        category: asset.category,
        type: asset.type,
        manufacturer: asset.manufacturer,
        model: asset.model,
        purchaseDate: asset.purchaseDate?.split('T')[0] || '',
        purchasePrice: asset.purchasePrice,
        currentValue: asset.currentValue,
        location: asset.location,
        status: asset.status,
        assignedTo: asset.assignedTo,
        specifications: asset.specifications,
        warrantyInfo: asset.warrantyInfo,
        notes: asset.notes
      });
    } else {
      setSelectedAsset(null);
      setAssetFormData({
        assetNumber: '',
        name: '',
        category: '',
        type: '',
        manufacturer: '',
        model: '',
        purchaseDate: '',
        purchasePrice: '',
        currentValue: '',
        location: '',
        status: 'active',
        assignedTo: '',
        specifications: '',
        warrantyInfo: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleOpenMaintenanceDialog = (asset) => {
    setSelectedAsset(asset);
    setMaintenanceFormData({
      assetId: asset._id,
      type: 'routine',
      description: '',
      date: '',
      cost: '',
      performedBy: '',
      nextMaintenanceDate: '',
      status: 'completed',
      notes: ''
    });
    setOpenMaintenanceDialog(true);
  };

  const handleOpenHistoryDialog = (asset) => {
    setSelectedAsset(asset);
    setOpenHistoryDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAsset(null);
  };

  const handleCloseMaintenanceDialog = () => {
    setOpenMaintenanceDialog(false);
    setSelectedAsset(null);
  };

  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false);
    setSelectedAsset(null);
  };

  const handleAssetInputChange = (e) => {
    setAssetFormData({
      ...assetFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMaintenanceInputChange = (e) => {
    setMaintenanceFormData({
      ...maintenanceFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAsset) {
        await axios.put(`/api/assets/${selectedAsset._id}`, assetFormData);
      } else {
        await axios.post('/api/assets', assetFormData);
      }
      fetchAssets();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/assets/maintenance', maintenanceFormData);
      fetchMaintenanceRecords();
      handleCloseMaintenanceDialog();
    } catch (error) {
      console.error('Error saving maintenance record:', error);
    }
  };

  const handleDelete = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await axios.delete(`/api/assets/${assetId}`);
        fetchAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'retired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMaintenanceStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAssetMaintenanceRecords = (assetId) => {
    return maintenanceRecords.filter(record => record.assetId === assetId);
  };

  // Calculate summary statistics
  const summaryStats = {
    totalAssets: assets.length,
    maintenanceNeeded: assets.filter(asset => asset.status === 'needs_maintenance').length,
    totalValue: assets.reduce((sum, asset) => sum + Number(asset.currentValue), 0).toFixed(2),
    activeMaintenanceJobs: maintenanceRecords.filter(record => record.status === 'in_progress').length
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Asset Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Asset
        </Button>
      </Box>

      {/* Summary Cards */}
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
              <AssetIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="textSecondary">Total Assets</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.totalAssets}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(211, 47, 47, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AlertIcon sx={{ color: 'error.main', mr: 1 }} />
              <Typography color="textSecondary">Needs Maintenance</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.maintenanceNeeded}</Typography>
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
              <ValueIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography color="textSecondary">Total Value</Typography>
            </Box>
            <Typography variant="h4">${summaryStats.totalValue}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(156, 39, 176, 0.05) 100%)`,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MaintenanceIcon sx={{ color: 'secondary.main', mr: 1 }} />
              <Typography color="textSecondary">Active Maintenance</Typography>
            </Box>
            <Typography variant="h4">{summaryStats.activeMaintenanceJobs}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs and Tables */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab label="Assets" />
          <Tab label="Maintenance Records" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset #</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset._id} hover>
                    <TableCell>{asset.assetNumber}</TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>
                      <Chip 
                        label={asset.status}
                        color={getStatusColor(asset.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>${asset.currentValue}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenMaintenanceDialog(asset)}
                        sx={{ color: 'warning.main' }}
                      >
                        <BuildIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenHistoryDialog(asset)}
                        sx={{ color: 'info.main', ml: 1 }}
                      >
                        <TimelineIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenDialog(asset)}
                        sx={{ color: 'primary.main', ml: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleDelete(asset._id)}
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
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Asset</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Next Maintenance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenanceRecords.map((record) => (
                  <TableRow key={record._id} hover>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.assetId?.name}</TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>
                      <Chip 
                        label={record.status}
                        color={getMaintenanceStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>${record.cost}</TableCell>
                    <TableCell>
                      {record.nextMaintenanceDate ? 
                        new Date(record.nextMaintenanceDate).toLocaleDateString() : 
                        'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Keep your existing dialogs with current form fields */}
    </Box>
  );
};

export default AssetManagement; 