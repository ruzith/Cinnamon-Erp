const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['revenue', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['production', 'maintenance', 'royalty', 'lease'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  well: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Well',
    required: true
  },
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease',
    required: true
  },
  entries: [{
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    description: String,
    debit: {
      type: Number,
      default: 0
    },
    credit: {
      type: Number,
      default: 0
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'posted', 'void'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema); 