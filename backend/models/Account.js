const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
    required: true
  },
  category: {
    type: String,
    enum: ['current', 'fixed', 'current-liability', 'long-term-liability', 'capital', 'operational'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  balance: {
    type: Number,
    default: 0
  },
  isSystemAccount: {
    type: Boolean,
    default: false
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

module.exports = mongoose.model('Account', accountSchema); 