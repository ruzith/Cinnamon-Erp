const mongoose = require('mongoose');

const loanPaymentSchema = new mongoose.Schema({
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  scheduleItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank-transfer', 'deduction', 'other'],
    required: true
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
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

module.exports = mongoose.model('LoanPayment', loanPaymentSchema); 