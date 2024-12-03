const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['IN', 'OUT', 'ADJUSTMENT']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  reference: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema); 