import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { updateSettings, getSettings } from '../features/settings/settingsSlice';
import axios from 'axios';

const timeZones = Intl.supportedValuesOf('timeZone').map(zone => {
  try {
    // Get the timezone offset for current date
    const offset = new Intl.DateTimeFormat('en', {
      timeZone: zone,
      timeZoneName: 'shortOffset'
    }).formatToParts().find(part => part.type === 'timeZoneName').value;

    // Get the location part (e.g., "New York" from "America/New_York")
    const location = zone.split('/').pop().replace(/_/g, ' ');

    return {
      value: zone,
      label: `(${offset}) ${location}`
    };
  } catch (e) {
    return null;
  }
}).filter(Boolean).sort((a, b) => a.label.localeCompare(b.label));

const Settings = () => {
  const dispatch = useDispatch();
  const { settings, isLoading } = useSelector(state => state.settings);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    vatNumber: '',
    taxNumber: '',
    timeZone: 'Asia/Colombo',
    defaultCurrency: '',
  });

  useEffect(() => {
    dispatch(getSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.company_name || '',
        companyAddress: settings.company_address || '',
        companyPhone: settings.company_phone || '',
        vatNumber: settings.vat_number || '',
        taxNumber: settings.tax_number || '',
        timeZone: settings.time_zone || 'Asia/Colombo',
        defaultCurrency: settings.default_currency || '',
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const name = e?.target?.name || e.name;
    const value = e?.target?.value ?? e.value;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If the default currency is changed, update the formData
    if (name === 'defaultCurrency') {
      setFormData(prev => ({
        ...prev,
        defaultCurrency: value
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogo(file);
    }
  };

  const handleSave = () => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (companyLogo) {
      data.append('logo', companyLogo);
    }
    dispatch(updateSettings(data));
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    if (settings) {
      setFormData({
        companyName: settings.company_name || '',
        companyAddress: settings.company_address || '',
        companyPhone: settings.company_phone || '',
        vatNumber: settings.vat_number || '',
        taxNumber: settings.tax_number || '',
        timeZone: settings.time_zone || 'Asia/Colombo',
        defaultCurrency: settings.default_currency || '',
      });
    }
    setEditMode(false);
  };

  const handleSaveAndClose = () => {
    handleSave();
    setEditMode(false);
  };

  const [currencies, setCurrencies] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const fetchCurrencies = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const response = await axios.get('/api/currencies', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCurrencies(response.data);
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to fetch currencies', 'error');
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    const token = JSON.parse(localStorage.getItem('user'))?.token;

    try {
      if (editingId) {
        await axios.put(`/api/currencies/${editingId}`, values, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        showMessage('Currency updated successfully');
      } else {
        await axios.post('/api/currencies', values, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        showMessage('Currency added successfully');
      }
      setModalVisible(false);
      setEditingId(null);
      fetchCurrencies();
    } catch (error) {
      showMessage(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      await axios.delete(`/api/currencies/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showMessage('Currency deleted successfully');
      fetchCurrencies();
    } catch (error) {
      showMessage(error.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const handleTimeZoneChange = async (e) => {
    const name = e?.target?.name || e.name;
    const value = e?.target?.value ?? e.value;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Save time zone to localStorage for immediate use
    localStorage.setItem('timeZone', value);
  };

  const [currencyFormData, setCurrencyFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    rate: '',
    status: 'active', // Default status
  });

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    setCurrencyFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrencySubmit = async () => {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    try {
        if (editingId) {
            // If editing, send a PUT request
            await axios.put(`/api/currencies/${editingId}`, currencyFormData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showMessage('Currency updated successfully');
        } else {
            // If adding, send a POST request
            const response = await axios.post('/api/currencies', currencyFormData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showMessage('Currency added successfully');

            // Check if default currency is empty and set it to the newly created currency
            if (!formData.defaultCurrency) {
                setFormData(prev => ({
                    ...prev,
                    defaultCurrency: response.data.id // Assuming the response contains the new currency's ID
                }));
            }
        }
        setModalVisible(false); // Close the modal
        setEditingId(null); // Reset editingId
        setCurrencyFormData({ // Reset form data
            code: '',
            name: '',
            symbol: '',
            rate: '',
            status: 'active', // Reset to default status
        });
        fetchCurrencies(); // Refresh the currency list
    } catch (error) {
        showMessage(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleEditCurrency = (currency) => {
    setCurrencyFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      rate: currency.rate,
      status: currency.status,
    });
    setEditingId(currency.id); // Set the editingId
    setModalVisible(true);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Currencies Section - Moved to top */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Currencies</Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingId(null);
                  setModalVisible(true);
                }}
              >
                Add Currency
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Rate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow key={currency.id}>
                      <TableCell>{currency.code}</TableCell>
                      <TableCell>{currency.name}</TableCell>
                      <TableCell>{currency.symbol}</TableCell>
                      <TableCell>{currency.rate}</TableCell>
                      <TableCell>{currency.status}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditCurrency(currency)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(currency.id)}
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
        </Grid>

        {/* Company Details - Moved below currencies */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Company Details</Typography>
              </Box>
              {!editMode ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
                  Edit Details
                </Button>
              ) : (
                <Box>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveAndClose}
                  >
                    Save Changes
                  </Button>
                </Box>
              )}
            </Box>

            {editMode ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="VAT Number"
                    name="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleChange}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tax Number"
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleChange}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Company Address"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AddIcon />}
                    sx={{ mb: 3 }}
                  >
                    Upload Company Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </Button>
                  {companyLogo && (
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                      Selected: {companyLogo.name}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Company Name
                    </Typography>
                    <Typography variant="body1">
                      {formData.companyName || 'Not set'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Phone Number
                    </Typography>
                    <Typography variant="body1">
                      {formData.companyPhone || 'Not set'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      VAT Number
                    </Typography>
                    <Typography variant="body1">
                      {formData.vatNumber || 'Not set'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Tax Number
                    </Typography>
                    <Typography variant="body1">
                      {formData.taxNumber || 'Not set'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Company Address
                    </Typography>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                      {formData.companyAddress || 'Not set'}
                    </Typography>
                  </Box>
                </Grid>
                {settings?.logo_url && (
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                        Company Logo
                      </Typography>
                      <img
                        src={settings.logo_url}
                        alt="Company Logo"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '100px',
                          objectFit: 'contain'
                        }}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SettingsIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">System Settings</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Currency</InputLabel>
                  <Select
                    name="defaultCurrency"
                    value={formData.defaultCurrency}
                    onChange={handleChange}
                    label="Default Currency"
                  >
                    {currencies.filter(c => c.status === 'active').map((currency) => (
                      <MenuItem key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Time Zone</InputLabel>
                  <Select
                    name="timeZone"
                    value={formData.timeZone}
                    onChange={handleTimeZoneChange}
                    label="Time Zone"
                  >
                    {timeZones.map((tz) => (
                      <MenuItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          Save Changes
        </Button>
      </Box>

      <Dialog open={modalVisible} onClose={() => setModalVisible(false)}>
        <DialogTitle>New Currency</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                autoFocus
                margin="dense"
                name="code"
                label="Currency Code"
                type="text"
                fullWidth
                variant="outlined"
                value={currencyFormData.code}
                onChange={handleCurrencyChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                name="name"
                label="Currency Name"
                type="text"
                fullWidth
                variant="outlined"
                value={currencyFormData.name}
                onChange={handleCurrencyChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                name="symbol"
                label="Currency Symbol"
                type="text"
                fullWidth
                variant="outlined"
                value={currencyFormData.symbol}
                onChange={handleCurrencyChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                name="rate"
                label="Exchange Rate"
                type="number"
                fullWidth
                variant="outlined"
                value={currencyFormData.rate}
                onChange={handleCurrencyChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalVisible(false)}>Cancel</Button>
          <Button onClick={handleCurrencySubmit}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;