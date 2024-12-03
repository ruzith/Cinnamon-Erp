const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'cancelled']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'partial', 'paid']
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: String,
  shippingAddress: String,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema); 