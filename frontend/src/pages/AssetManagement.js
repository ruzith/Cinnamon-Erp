import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import TimelineIcon from '@mui/icons-material/Timeline';
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Assets" />
          <Tab label="Maintenance Records" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Typography variant="h6">Asset Management</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog()}
            >
              Add New Asset
            </Button>
          </div>

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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset._id}>
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
                    <TableCell>
                      <IconButton onClick={() => handleOpenMaintenanceDialog(asset)}>
                        <BuildIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenHistoryDialog(asset)}>
                        <TimelineIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenDialog(asset)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(asset._id)}>
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
          <Typography variant="h6" sx={{ mb: 2 }}>Maintenance Records</Typography>
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
                  <TableRow key={record._id}>
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

        {/* Asset Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedAsset ? 'Edit Asset' : 'Add New Asset'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  name="assetNumber"
                  label="Asset Number"
                  fullWidth
                  value={assetFormData.assetNumber}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="name"
                  label="Asset Name"
                  fullWidth
                  value={assetFormData.name}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="category"
                  label="Category"
                  fullWidth
                  value={assetFormData.category}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="type"
                  label="Type"
                  fullWidth
                  value={assetFormData.type}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="manufacturer"
                  label="Manufacturer"
                  fullWidth
                  value={assetFormData.manufacturer}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="model"
                  label="Model"
                  fullWidth
                  value={assetFormData.model}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="purchaseDate"
                  label="Purchase Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={assetFormData.purchaseDate}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="purchasePrice"
                  label="Purchase Price"
                  type="number"
                  fullWidth
                  value={assetFormData.purchasePrice}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="currentValue"
                  label="Current Value"
                  type="number"
                  fullWidth
                  value={assetFormData.currentValue}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="location"
                  label="Location"
                  fullWidth
                  value={assetFormData.location}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={6}>
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
              <Grid item xs={6}>
                <TextField
                  name="assignedTo"
                  label="Assigned To"
                  fullWidth
                  value={assetFormData.assignedTo}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="specifications"
                  label="Specifications"
                  fullWidth
                  multiline
                  rows={2}
                  value={assetFormData.specifications}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="warrantyInfo"
                  label="Warranty Information"
                  fullWidth
                  multiline
                  rows={2}
                  value={assetFormData.warrantyInfo}
                  onChange={handleAssetInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={assetFormData.notes}
                  onChange={handleAssetInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleAssetSubmit} color="primary">
              {selectedAsset ? 'Update Asset' : 'Add Asset'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Maintenance Dialog */}
        <Dialog 
          open={openMaintenanceDialog} 
          onClose={handleCloseMaintenanceDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add Maintenance Record</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Asset: {selectedAsset?.name} ({selectedAsset?.assetNumber})
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Maintenance Type</InputLabel>
                  <Select
                    name="type"
                    value={maintenanceFormData.type}
                    label="Maintenance Type"
                    onChange={handleMaintenanceInputChange}
                  >
                    <MenuItem value="routine">Routine</MenuItem>
                    <MenuItem value="repair">Repair</MenuItem>
                    <MenuItem value="inspection">Inspection</MenuItem>
                    <MenuItem value="upgrade">Upgrade</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="date"
                  label="Maintenance Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={maintenanceFormData.date}
                  onChange={handleMaintenanceInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={maintenanceFormData.description}
                  onChange={handleMaintenanceInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="cost"
                  label="Cost"
                  type="number"
                  fullWidth
                  value={maintenanceFormData.cost}
                  onChange={handleMaintenanceInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="performedBy"
                  label="Performed By"
                  fullWidth
                  value={maintenanceFormData.performedBy}
                  onChange={handleMaintenanceInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="nextMaintenanceDate"
                  label="Next Maintenance Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={maintenanceFormData.nextMaintenanceDate}
                  onChange={handleMaintenanceInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={maintenanceFormData.status}
                    label="Status"
                    onChange={handleMaintenanceInputChange}
                  >
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={maintenanceFormData.notes}
                  onChange={handleMaintenanceInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseMaintenanceDialog}>Cancel</Button>
            <Button onClick={handleMaintenanceSubmit} color="primary">
              Save Maintenance Record
            </Button>
          </DialogActions>
        </Dialog>

        {/* History Dialog */}
        <Dialog
          open={openHistoryDialog}
          onClose={handleCloseHistoryDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Maintenance History</DialogTitle>
          <DialogContent>
            {selectedAsset && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    Asset: {selectedAsset.name} ({selectedAsset.assetNumber})
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Cost</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getAssetMaintenanceRecords(selectedAsset._id).map((record) => (
                          <TableRow key={record._id}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{record.type}</TableCell>
                            <TableCell>{record.description}</TableCell>
                            <TableCell>${record.cost}</TableCell>
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
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseHistoryDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default AssetManagement; 