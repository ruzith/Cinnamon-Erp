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
  Inventory as AssetIcon,
  Warning as AlertIcon,
  Build as BuildIcon,
  Timeline as TimelineIcon,
  AttachMoney as ValueIcon,
  Construction as ConstructionIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useCurrencyFormatter } from '../utils/currencyUtils';
import SummaryCard from '../components/common/SummaryCard';
import { useSnackbar } from 'notistack';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && children}
    </div>
  );
};

const MaintenanceDialog = ({
  open,
  onClose,
  formData,
  onChange,
  onSubmit
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>Add Maintenance Record</DialogTitle>
    <DialogContent>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={formData.type}
              label="Type"
              onChange={onChange}
              required
            >
              <MenuItem value="routine">Routine</MenuItem>
              <MenuItem value="repair">Repair</MenuItem>
              <MenuItem value="upgrade">Upgrade</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={onChange}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={2}
            value={formData.description}
            onChange={onChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Cost"
            name="cost"
            type="number"
            value={formData.cost}
            onChange={onChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Performed By"
            name="performedBy"
            value={formData.performedBy}
            onChange={onChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Next Maintenance Date"
            name="nextMaintenanceDate"
            type="date"
            value={formData.nextMaintenanceDate}
            onChange={onChange}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            multiline
            rows={2}
            value={formData.notes}
            onChange={onChange}
          />
        </Grid>
      </Grid>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onSubmit}>
        Save
      </Button>
    </DialogActions>
  </Dialog>
);

const AssetManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [assets, setAssets] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [categories, setCategories] = useState([]);

  const [assetFormData, setAssetFormData] = useState({
    assetNumber: '',
    name: '',
    category: '',
    type: '',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    status: 'active'
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

  const { formatCurrency } = useCurrencyFormatter();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchAssets();
    fetchMaintenanceRecords();
    fetchCategories();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets');
      const transformedAssets = response.data.map(asset => ({
        ...asset,
        currentValue: asset.current_value,
        purchaseDate: asset.purchase_date,
        purchasePrice: asset.purchase_price,
        assetNumber: asset.asset_number,
        categoryName: asset.category_name,
        createdBy: asset.created_by,
        createdAt: asset.created_at,
        updatedAt: asset.updated_at,
        categoryId: asset.category_id,
        assignedTo: asset.assigned_to,
        createdByName: asset.created_by_name
      }));
      setAssets(transformedAssets);
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

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/assets/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEdit = (asset) => {
    setSelectedAsset(asset);
    setAssetFormData({
      assetNumber: asset?.asset_number || '',
      name: asset?.name || '',
      category: asset?.category || '',
      type: asset?.type || '',
      purchaseDate: asset?.purchase_date ? asset.purchase_date.split('T')[0] : '',
      purchasePrice: asset?.purchase_price || '',
      currentValue: asset?.current_value || '',
      status: asset?.status || 'active'
    });
    setOpenDialog(true);
  };

  const handleMaintenance = (asset) => {
    setSelectedAsset(asset);
    setMaintenanceFormData({
      assetId: asset.id,
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

  const handleViewHistory = async (asset) => {
    try {
      const response = await axios.get(`/api/assets/${asset.id}/maintenance`);
      setSelectedAsset({
        ...asset,
        maintenanceHistory: response.data
      });
      setOpenHistoryDialog(true);
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setAssetFormData({
      assetNumber: '',
      name: '',
      category: '',
      type: '',
      purchaseDate: '',
      purchasePrice: '',
      currentValue: '',
      status: 'active'
    });
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
    const { name, value } = e.target;
    setMaintenanceFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const assetData = {
        assetNumber: assetFormData.assetNumber,
        name: assetFormData.name,
        category: assetFormData.category,
        type: assetFormData.type,
        purchaseDate: assetFormData.purchaseDate,
        purchasePrice: assetFormData.purchasePrice,
        currentValue: assetFormData.currentValue,
        status: assetFormData.status
      };

      if (selectedAsset) {
        await axios.put(`/api/assets/${selectedAsset.id}`, assetData);
        enqueueSnackbar('Asset updated successfully', { variant: 'success' });
      } else {
        await axios.post('/api/assets', assetData);
        enqueueSnackbar('Asset created successfully', { variant: 'success' });
      }
      handleCloseDialog();
      fetchAssets();
    } catch (error) {
      console.error('Error saving asset:', error);
      enqueueSnackbar('Error saving asset', { variant: 'error' });
    }
  };

  const handleMaintenanceSubmit = async () => {
    try {
      // Prepare maintenance data with proper default values
      const maintenanceData = {
        asset_id: maintenanceFormData.assetId,
        type: maintenanceFormData.type || 'routine',
        description: maintenanceFormData.description || '',
        maintenance_date: maintenanceFormData.date || new Date().toISOString().split('T')[0],
        cost: parseFloat(maintenanceFormData.cost) || 0,
        performed_by: maintenanceFormData.performedBy || '',
        next_maintenance_date: maintenanceFormData.nextMaintenanceDate || null,
        status: maintenanceFormData.status || 'completed',
        notes: maintenanceFormData.notes || ''
      };

      await axios.post(`/api/assets/${maintenanceFormData.assetId}/maintenance`, maintenanceData);

      handleCloseMaintenanceDialog();
      fetchMaintenanceRecords();
      enqueueSnackbar('Maintenance record added successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error adding maintenance:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error adding maintenance record', { variant: 'error' });
    }
  };

  const handleDelete = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await axios.delete(`/api/assets/${assetId}`);
        fetchAssets();
        fetchMaintenanceRecords();
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
    activeAssets: assets.filter(asset => asset.status === 'active').length,
    totalValue: assets.reduce((sum, asset) => sum + Number(asset.current_value || 0), 0),
    pendingMaintenance: maintenanceRecords.filter(record => record.status === 'pending').length,
    avgMaintenanceCost: maintenanceRecords.length > 0
      ? maintenanceRecords.reduce((sum, record) => sum + Number(record.cost || 0), 0) / maintenanceRecords.length
      : 0
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Add history dialog
  const HistoryDialog = () => (
    <Dialog
      open={openHistoryDialog}
      onClose={handleCloseHistoryDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Maintenance History</DialogTitle>
      <DialogContent>
        {selectedAsset?.maintenanceHistory?.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Performed By</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedAsset.maintenanceHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.maintenance_date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.type}
                        color={record.type === 'repair' ? 'error' :
                               record.type === 'upgrade' ? 'info' : 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>{formatCurrency(record.cost)}</TableCell>
                    <TableCell>{record.performed_by}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={getMaintenanceStatusColor(record.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            No maintenance records found
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseHistoryDialog}>Close</Button>
      </DialogActions>
    </Dialog>
  );

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
          onClick={() => handleEdit(null)}
        >
          New Asset
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={BuildIcon}
            title="Active Assets"
            value={summaryStats.activeAssets}
            iconColor="#9C27B0"
            gradientColor="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AttachMoneyIcon}
            title="Total Asset Value"
            value={formatCurrency(summaryStats.totalValue)}
            iconColor="#D32F2F"
            gradientColor="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={TimelineIcon}
            title="Pending Maintenance"
            value={summaryStats.pendingMaintenance}
            iconColor="#ED6C02"
            gradientColor="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={ConstructionIcon}
            title="Avg Maintenance Cost"
            value={formatCurrency(summaryStats.avgMaintenanceCost)}
            iconColor="#0288D1"
            gradientColor="info"
          />
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
                  <TableCell>Asset Number</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Purchase Date</TableCell>
                  <TableCell>Purchase Price</TableCell>
                  <TableCell>Current Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id} hover>
                    <TableCell>{asset.asset_number}</TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.category_name}</TableCell>
                    <TableCell style={{ textTransform: 'capitalize' }}>{asset.type}</TableCell>
                    <TableCell>{formatDate(asset.purchase_date)}</TableCell>
                    <TableCell>{formatCurrency(asset.purchase_price)}</TableCell>
                    <TableCell>{formatCurrency(asset.current_value)}</TableCell>
                    <TableCell>
                      <Chip
                        label={asset.status}
                        color={getStatusColor(asset.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleMaintenance(asset)}
                        title="Maintenance"
                        sx={{ color: 'info.main', ml: 1 }}
                      >
                        <BuildIcon/>
                      </IconButton>
                      <IconButton
                        onClick={() => handleViewHistory(asset)}
                        title="View History"
                        sx={{ color: 'success.main', ml: 1 }}
                      >
                        <TimelineIcon/>
                      </IconButton>
                      <IconButton
                        onClick={() => handleEdit(asset)}
                        title="Edit Asset"
                        sx={{ color: 'primary.main', ml: 1 }}
                      >
                        <EditIcon/>
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(asset.id)}
                        title="Delete Asset"
                        sx={{ color: 'error.main', ml: 1 }}
                      >
                        <DeleteIcon/>
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
                  <TableCell>Performed By</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Next Maintenance</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenanceRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>{formatDate(record.maintenance_date)}</TableCell>
                    <TableCell>
                      {record.asset_name}
                      <Typography variant="caption" display="block" color="textSecondary">
                        {record.asset_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.type}
                        color={record.type === 'repair' ? 'error' :
                               record.type === 'upgrade' ? 'info' : 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>{record.performed_by}</TableCell>
                    <TableCell>{formatCurrency(record.cost)}</TableCell>
                    <TableCell>{record.next_maintenance_date ? formatDate(record.next_maintenance_date) : 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={getMaintenanceStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Keep your existing dialogs with current form fields */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedAsset ? 'Edit Asset' : 'New Asset'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Asset Number"
                name="assetNumber"
                value={assetFormData.assetNumber}
                onChange={handleAssetInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Asset Name"
                name="name"
                value={assetFormData.name}
                onChange={handleAssetInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={assetFormData.category}
                onChange={handleAssetInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Type"
                name="type"
                value={assetFormData.type}
                onChange={handleAssetInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Date"
                name="purchaseDate"
                type="date"
                value={assetFormData.purchaseDate}
                onChange={handleAssetInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Price"
                name="purchasePrice"
                type="number"
                value={assetFormData.purchasePrice}
                onChange={handleAssetInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Current Value"
                name="currentValue"
                type="number"
                value={assetFormData.currentValue}
                onChange={handleAssetInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={assetFormData.status}
                  label="Status"
                  onChange={handleAssetInputChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="maintenance">In Maintenance</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedAsset ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add these dialogs to your return statement */}
      <MaintenanceDialog
        open={openMaintenanceDialog}
        onClose={handleCloseMaintenanceDialog}
        formData={maintenanceFormData}
        onChange={handleMaintenanceInputChange}
        onSubmit={handleMaintenanceSubmit}
      />
      <HistoryDialog />
    </Box>
  );
};

export default AssetManagement;