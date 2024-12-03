const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  borrowerName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  interestRate: {
    type: Number,
    required: true
  },
  term: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'overdue', 'defaulted']
  },
  paymentFrequency: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly', 'quarterly', 'annually']
  },
  collateral: String,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Loan', loanSchema); 