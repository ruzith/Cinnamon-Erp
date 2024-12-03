const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  grade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grade',
    required: true
  },
  totalWeight: {
    type: Number,
    required: true,
    min: 0
  },
  deductWeight1: {
    type: Number,
    default: 0,
    min: 0
  },
  deductWeight2: {
    type: Number,
    default: 0,
    min: 0
  },
  netWeight: {
    type: Number,
    required: true,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const purchaseInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManufacturingContractor',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: [purchaseItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  cuttingRate: {
    type: Number,
    required: true,
    min: 0,
    default: 250 // Default cutting rate
  },
  totalNetWeight: {
    type: Number,
    required: true,
    min: 0
  },
  cuttingCharges: {
    type: Number,
    required: true,
    min: 0
  },
  advancePayments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdvancePayment'
  }],
  totalAdvance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'paid', 'cancelled'],
    default: 'draft'
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

// Generate invoice number before saving
purchaseInvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.invoiceNumber = `PUR${year}${month}${count.toString().padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
purchaseInvoiceSchema.pre('save', function(next) {
  // Calculate total net weight and amount
  this.totalNetWeight = this.items.reduce((sum, item) => sum + item.netWeight, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate cutting charges
  this.cuttingCharges = this.totalNetWeight * this.cuttingRate;
  
  // Calculate final amount
  this.finalAmount = this.totalAmount - this.cuttingCharges - this.totalAdvance;
  
  next();
});

module.exports = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema); 