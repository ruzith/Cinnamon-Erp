const mongoose = require('mongoose');

const advancePaymentSchema = new mongoose.Schema({
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManufacturingContractor',
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
advancePaymentSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.receiptNumber = `ADV${year}${month}${count.toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('AdvancePayment', advancePaymentSchema); 