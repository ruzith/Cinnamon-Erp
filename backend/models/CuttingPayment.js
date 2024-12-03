const mongoose = require('mongoose');

const cuttingPaymentSchema = new mongoose.Schema({
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CuttingContractor',
    required: true
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandAssignment',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 250 // Total cutting fee
  },
  companyContribution: {
    type: Number,
    required: true,
    default: 100 // Company's direct payment
  },
  manufacturingContribution: {
    type: Number,
    required: true,
    default: 150 // Manufacturing division's contribution
  },
  status: {
    type: String,
    enum: ['paid', 'due', 'pending'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate receipt number before saving
cuttingPaymentSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.receiptNumber = `CUT${year}${month}${count.toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CuttingPayment', cuttingPaymentSchema); 