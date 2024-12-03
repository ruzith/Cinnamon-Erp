const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  unit: {
    type: String,
    required: true
  },
  minStockLevel: {
    type: Number,
    required: true
  },
  maxStockLevel: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  },
  description: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema); 