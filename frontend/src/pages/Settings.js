import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Box,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
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

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
  const [generalSettings, setGeneralSettings] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'UTC',
    fiscalYearStart: '',
    logo: null
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    paymentReminders: true,
    taskDeadlines: true,
    maintenanceAlerts: true,
    loanDueAlerts: true
  });

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    lastBackup: null,
    retentionPeriod: 30,
    backupLocation: 'cloud'
  });

  const [userPreferences, setUserPreferences] = useState({
    theme: 'light',
    language: 'en',
    dashboardLayout: 'default',
    itemsPerPage: 10,
    defaultView: 'list'
  });

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', type: '' });
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      const { general, notifications, backup, preferences } = response.data;
      setGeneralSettings(general);
      setNotificationSettings(notifications);
      setBackupSettings(backup);
      setUserPreferences(preferences);
    } catch (error) {
      showAlert('error', 'Error fetching settings');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/settings/categories');
      setCategories(response.data);
    } catch (error) {
      showAlert('error', 'Error fetching categories');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleGeneralSettingsChange = (e) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationSettingsChange = (e) => {
    setNotificationSettings({
      ...notificationSettings,
      [e.target.name]: e.target.checked
    });
  };

  const handleBackupSettingsChange = (e) => {
    setBackupSettings({
      ...backupSettings,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    });
  };

  const handleUserPreferencesChange = (e) => {
    setUserPreferences({
      ...userPreferences,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveSettings = async (settingType) => {
    try {
      let data;
      switch (settingType) {
        case 'general':
          data = generalSettings;
          break;
        case 'notifications':
          data = notificationSettings;
          break;
        case 'backup':
          data = backupSettings;
          break;
        case 'preferences':
          data = userPreferences;
          break;
        default:
          return;
      }

      await axios.put(`/api/settings/${settingType}`, data);
      showAlert('success', 'Settings saved successfully');
    } catch (error) {
      showAlert('error', 'Error saving settings');
    }
  };

  const handleAddCategory = async () => {
    try {
      await axios.post('/api/settings/categories', newCategory);
      fetchCategories();
      setNewCategory({ name: '', type: '' });
      showAlert('success', 'Category added successfully');
    } catch (error) {
      showAlert('error', 'Error adding category');
    }
  };

  const handleUpdateCategory = async (categoryId) => {
    try {
      await axios.put(`/api/settings/categories/${categoryId}`, editingCategory);
      fetchCategories();
      setEditingCategory(null);
      showAlert('success', 'Category updated successfully');
    } catch (error) {
      showAlert('error', 'Error updating category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`/api/settings/categories/${categoryId}`);
        fetchCategories();
        showAlert('success', 'Category deleted successfully');
      } catch (error) {
        showAlert('error', 'Error deleting category');
      }
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {alert.show && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="General" />
          <Tab label="Notifications" />
          <Tab label="Backup" />
          <Tab label="Categories" />
          <Tab label="Preferences" />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="companyName"
                label="Company Name"
                fullWidth
                value={generalSettings.companyName}
                onChange={handleGeneralSettingsChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email"
                fullWidth
                value={generalSettings.email}
                onChange={handleGeneralSettingsChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="phone"
                label="Phone"
                fullWidth
                value={generalSettings.phone}
                onChange={handleGeneralSettingsChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="taxNumber"
                label="Tax Number"
                fullWidth
                value={generalSettings.taxNumber}
                onChange={handleGeneralSettingsChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={generalSettings.address}
                onChange={handleGeneralSettingsChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  name="currency"
                  value={generalSettings.currency}
                  label="Currency"
                  onChange={handleGeneralSettingsChange}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Date Format</InputLabel>
                <Select
                  name="dateFormat"
                  value={generalSettings.dateFormat}
                  label="Date Format"
                  onChange={handleGeneralSettingsChange}
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  name="timezone"
                  value={generalSettings.timezone}
                  label="Timezone"
                  onChange={handleGeneralSettingsChange}
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="EST">EST</MenuItem>
                  <MenuItem value="PST">PST</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('general')}
              >
                Save General Settings
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onChange={handleNotificationSettingsChange}
                  />
                }
                label="Email Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="lowStockAlerts"
                    checked={notificationSettings.lowStockAlerts}
                    onChange={handleNotificationSettingsChange}
                  />
                }
                label="Low Stock Alerts"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="paymentReminders"
                    checked={notificationSettings.paymentReminders}
                    onChange={handleNotificationSettingsChange}
                  />
                }
                label="Payment Reminders"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="taskDeadlines"
                    checked={notificationSettings.taskDeadlines}
                    onChange={handleNotificationSettingsChange}
                  />
                }
                label="Task Deadlines"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="maintenanceAlerts"
                    checked={notificationSettings.maintenanceAlerts}
                    onChange={handleNotificationSettingsChange}
                  />
                }
                label="Maintenance Alerts"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="loanDueAlerts"
                    checked={notificationSettings.loanDueAlerts}
                    onChange={handleNotificationSettingsChange}
                  />
                }
                label="Loan Due Alerts"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('notifications')}
              >
                Save Notification Settings
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Backup Settings */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="autoBackup"
                    checked={backupSettings.autoBackup}
                    onChange={handleBackupSettingsChange}
                  />
                }
                label="Automatic Backup"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Backup Frequency</InputLabel>
                <Select
                  name="backupFrequency"
                  value={backupSettings.backupFrequency}
                  label="Backup Frequency"
                  onChange={handleBackupSettingsChange}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="retentionPeriod"
                label="Retention Period (days)"
                type="number"
                fullWidth
                value={backupSettings.retentionPeriod}
                onChange={handleBackupSettingsChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Backup Location</InputLabel>
                <Select
                  name="backupLocation"
                  value={backupSettings.backupLocation}
                  label="Backup Location"
                  onChange={handleBackupSettingsChange}
                >
                  <MenuItem value="local">Local Storage</MenuItem>
                  <MenuItem value="cloud">Cloud Storage</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('backup')}
              >
                Save Backup Settings
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Categories */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Add New Category
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <TextField
                    name="name"
                    label="Category Name"
                    fullWidth
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={newCategory.type}
                      label="Type"
                      onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                    >
                      <MenuItem value="income">Income</MenuItem>
                      <MenuItem value="expense">Expense</MenuItem>
                      <MenuItem value="asset">Asset</MenuItem>
                      <MenuItem value="inventory">Inventory</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddCategory}
                    fullWidth
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Existing Categories
              </Typography>
              <List>
                {categories.map((category) => (
                  <ListItem key={category._id}>
                    {editingCategory?._id === category._id ? (
                      <>
                        <TextField
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({
                            ...editingCategory,
                            name: e.target.value
                          })}
                          size="small"
                        />
                        <Button
                          onClick={() => handleUpdateCategory(category._id)}
                          size="small"
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <ListItemText
                          primary={category.name}
                          secondary={category.type}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => setEditingCategory(category)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteCategory(category._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        {/* User Preferences */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  name="theme"
                  value={userPreferences.theme}
                  label="Theme"
                  onChange={handleUserPreferencesChange}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  name="language"
                  value={userPreferences.language}
                  label="Language"
                  onChange={handleUserPreferencesChange}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Dashboard Layout</InputLabel>
                <Select
                  name="dashboardLayout"
                  value={userPreferences.dashboardLayout}
                  label="Dashboard Layout"
                  onChange={handleUserPreferencesChange}
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="compact">Compact</MenuItem>
                  <MenuItem value="comfortable">Comfortable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Items Per Page</InputLabel>
                <Select
                  name="itemsPerPage"
                  value={userPreferences.itemsPerPage}
                  label="Items Per Page"
                  onChange={handleUserPreferencesChange}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('preferences')}
              >
                Save Preferences
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Settings; 