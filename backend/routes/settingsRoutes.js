const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Settings = require('../models/Settings');
const SettingsCategory = require('../models/SettingsCategory');

// Get settings
router.get('/', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({
        general: {
          companyName: '',
          email: '',
          phone: '',
          address: '',
          taxNumber: '',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          timezone: 'UTC'
        },
        notifications: {
          emailNotifications: true,
          lowStockAlerts: true,
          paymentReminders: true,
          taskDeadlines: true,
          maintenanceAlerts: true,
          loanDueAlerts: true
        },
        backup: {
          autoBackup: true,
          backupFrequency: 'daily',
          retentionPeriod: 30,
          backupLocation: 'cloud'
        },
        preferences: {
          theme: 'light',
          language: 'en',
          dashboardLayout: 'default',
          itemsPerPage: 10,
          defaultView: 'list'
        },
        lastUpdatedBy: req.user.id
      });
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update settings
router.put('/:type', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({
        [req.params.type]: req.body,
        lastUpdatedBy: req.user.id
      });
    } else {
      settings[req.params.type] = req.body;
      settings.lastUpdatedBy = req.user.id;
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get settings categories
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await SettingsCategory.find({ status: 'active' })
      .sort('order name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create settings category
router.post('/categories', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await SettingsCategory.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update settings category
router.put('/categories/:code', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await SettingsCategory.findOneAndUpdate(
      { code: req.params.code },
      req.body,
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'Settings category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete settings category
router.delete('/categories/:code', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await SettingsCategory.findOne({ code: req.params.code });
    if (!category) {
      return res.status(404).json({ message: 'Settings category not found' });
    }
    
    // Instead of deleting, mark as inactive
    category.status = 'inactive';
    await category.save();
    
    res.json({ message: 'Settings category deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get settings category by code
router.get('/categories/:code', protect, async (req, res) => {
  try {
    const category = await SettingsCategory.findOne({ 
      code: req.params.code,
      status: 'active'
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Settings category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 