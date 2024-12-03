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
import { updateSettings, addCurrency, editCurrency, deleteCurrency } from '../features/settings/settingsSlice';

const timeZones = [
  { value: 'Asia/Colombo', label: '(GMT+05:30) Colombo' },
  { value: 'Asia/Kolkata', label: '(GMT+05:30) Mumbai, New Delhi' },
  { value: 'Asia/Dubai', label: '(GMT+04:00) Dubai, UAE' },
  { value: 'Asia/Singapore', label: '(GMT+08:00) Singapore' },
  { value: 'Europe/London', label: '(GMT+00:00) London' },
  { value: 'America/New_York', label: '(GMT-05:00) New York' },
  { value: 'Pacific/Auckland', label: '(GMT+12:00) Auckland' },
];

const Settings = () => {
  const dispatch = useDispatch();
  const { settings, isLoading } = useSelector(state => state.settings);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [currencyDialog, setCurrencyDialog] = useState({ open: false, mode: 'add', data: null });

  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    vatNumber: '',
    taxNumber: '',
    defaultLanguage: 'en',
    timeZone: 'Asia/Colombo',
    currencies: []
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogo(file);
      // You might want to preview the image here
    }
  };

  const handleSave = () => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'currencies') {
        data.append(key, JSON.stringify(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    });
    if (companyLogo) {
      data.append('logo', companyLogo);
    }
    dispatch(updateSettings(data));
  };

  const handleCurrencyDialog = (mode, data = null) => {
    setCurrencyDialog({ open: true, mode, data });
  };

  const handleCurrencySubmit = (currencyData) => {
    if (currencyDialog.mode === 'add') {
      dispatch(addCurrency(currencyData));
    } else {
      dispatch(editCurrency(currencyData));
    }
    setCurrencyDialog({ open: false, mode: 'add', data: null });
  };

  const handleCurrencyDelete = (currencyCode) => {
    dispatch(deleteCurrency(currencyCode));
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Company Details */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <BusinessIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Company Details</Typography>
            </Box>

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
          </Paper>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SettingsIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">System Settings</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Default Language</InputLabel>
                  <Select
                    value={formData.defaultLanguage}
                    onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="si">සිංහල</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Time Zone</InputLabel>
                  <Select
                    value={formData.timeZone}
                    onChange={(e) => handleChange('timeZone', e.target.value)}
                  >
                    {timeZones.map(tz => (
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

        {/* Currency Management */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <MoneyIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="h6">Currency Management</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleCurrencyDialog('add')}
                sx={{ ml: 'auto' }}
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
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.currencies.map((currency) => (
                    <TableRow key={currency.code}>
                      <TableCell>{currency.code}</TableCell>
                      <TableCell>{currency.name}</TableCell>
                      <TableCell>{currency.symbol}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleCurrencyDialog('edit', currency)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleCurrencyDelete(currency.code)}
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

      {/* Currency Dialog */}
      <CurrencyDialog
        open={currencyDialog.open}
        mode={currencyDialog.mode}
        data={currencyDialog.data}
        onClose={() => setCurrencyDialog({ open: false, mode: 'add', data: null })}
        onSubmit={handleCurrencySubmit}
      />
    </Box>
  );
};

// Currency Dialog Component
const CurrencyDialog = ({ open, mode, data, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    rate: 1,
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    } else {
      setFormData({
        code: '',
        name: '',
        symbol: '',
        rate: 1,
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{mode === 'add' ? 'Add Currency' : 'Edit Currency'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Currency Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              disabled={mode === 'edit'}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Currency Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Exchange Rate"
              name="rate"
              value={formData.rate}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSubmit(formData)} color="primary">
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Settings; 