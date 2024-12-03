const mongoose = require('mongoose');

const assetMaintenanceSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  maintenanceDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['routine', 'repair', 'upgrade'],
    required: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  performedBy: {
    type: String,
    required: true,
    trim: true
  },
  nextMaintenanceDate: {
    type: Date
  },
  attachments: [{
    name: String,
    url: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AssetMaintenance', assetMaintenanceSchema); 