const Settings = require('../models/domain/Settings');
const { validateSettings } = require('../validators/settingsValidator');
const { pool } = require('../config/db');
const fs = require('fs');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json(settings || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    const settingsData = {
      company_name: req.body.companyName,
      company_address: req.body.companyAddress,
      company_phone: req.body.companyPhone,
      vat_number: req.body.vatNumber,
      tax_number: req.body.taxNumber,
      language: req.body.defaultLanguage,
      time_zone: req.body.timeZone,
      default_currency: req.body.defaultCurrency,
      email_notifications: req.body.emailNotifications,
      low_stock_alerts: req.body.lowStockAlerts,
      payment_reminders: req.body.paymentReminders,
      task_deadlines: req.body.taskDeadlines,
      maintenance_alerts: req.body.maintenanceAlerts,
      loan_due_alerts: req.body.loanDueAlerts,
      auto_backup: req.body.autoBackup,
      backup_frequency: req.body.backupFrequency,
      retention_period: req.body.retentionPeriod,
      backup_location: req.body.backupLocation
    };
    
    // Handle file upload if present
    if (req.file) {
      settingsData.logo_url = `/uploads/${req.file.filename}`;
    }

    // Convert boolean strings to actual booleans
    const booleanFields = [
      'email_notifications',
      'low_stock_alerts',
      'payment_reminders',
      'task_deadlines',
      'maintenance_alerts',
      'loan_due_alerts',
      'auto_backup'
    ];

    booleanFields.forEach(field => {
      if (field in settingsData) {
        settingsData[field] = settingsData[field] === 'true' || settingsData[field] === true;
      }
    });

    Object.keys(settingsData).forEach(key => 
      settingsData[key] === undefined && delete settingsData[key]
    );

    // If time zone is changing, validate it
    if (settingsData.time_zone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: settingsData.time_zone });
      } catch (e) {
        return res.status(400).json({ message: 'Invalid timezone' });
      }
    }

    // Validate settings
    const { error } = validateSettings(settingsData);
    if (error) {
      // If there was a file upload, delete it since validation failed
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: error.details[0].message });
    }

    const settings = await Settings.updateSettings(settingsData);

    // Return updated settings with a flag indicating time zone change
    res.status(200).json({
      ...settings,
      timeZoneChanged: settingsData.time_zone && settings.time_zone !== settingsData.time_zone
    });
  } catch (error) {
    // If there was a file upload, delete it since an error occurred
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get specific setting
// @route   GET /api/settings/:key
// @access  Private
exports.getSetting = async (req, res) => {
  try {
    const value = await Settings.getSetting(req.params.key);
    if (value === null) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.status(200).json({ [req.params.key]: value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update specific setting
// @route   PUT /api/settings/:key
// @access  Private/Admin
exports.updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ message: 'Value is required' });
    }

    const setting = await Settings.updateSetting(req.params.key, value);
    res.status(200).json(setting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 