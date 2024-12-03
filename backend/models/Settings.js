const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  general: {
    companyName: String,
    email: String,
    phone: String,
    address: String,
    taxNumber: String,
    currency: {
      type: String,
      default: 'USD'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    fiscalYearStart: String,
    logo: String
  },
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    lowStockAlerts: {
      type: Boolean,
      default: true
    },
    paymentReminders: {
      type: Boolean,
      default: true
    },
    taskDeadlines: {
      type: Boolean,
      default: true
    },
    maintenanceAlerts: {
      type: Boolean,
      default: true
    },
    loanDueAlerts: {
      type: Boolean,
      default: true
    }
  },
  backup: {
    autoBackup: {
      type: Boolean,
      default: true
    },
    backupFrequency: {
      type: String,
      default: 'daily'
    },
    retentionPeriod: {
      type: Number,
      default: 30
    },
    backupLocation: {
      type: String,
      default: 'cloud'
    }
  },
  preferences: {
    theme: {
      type: String,
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    dashboardLayout: {
      type: String,
      default: 'default'
    },
    itemsPerPage: {
      type: Number,
      default: 10
    },
    defaultView: {
      type: String,
      default: 'list'
    }
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema); 