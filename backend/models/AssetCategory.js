const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  depreciationRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10 // Default 10% annual depreciation
  },
  usefulLife: {
    type: Number,
    required: true,
    min: 1,
    default: 5 // Default 5 years
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AssetCategory', assetCategorySchema); 