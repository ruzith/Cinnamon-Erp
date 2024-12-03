const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
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
    }
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema); 