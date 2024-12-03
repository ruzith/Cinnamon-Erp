const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  assetNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssetCategory',
    required: true
  },
  type: {
    type: String,
    enum: ['equipment', 'vehicle', 'tool'],
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'retired'],
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Well'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Asset', assetSchema); 