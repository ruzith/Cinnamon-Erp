const mongoose = require('mongoose');

const payrollItemSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  earnings: [{
    name: String,
    amount: Number
  }],
  deductions: [{
    name: String,
    amount: Number
  }],
  grossSalary: {
    type: Number,
    required: true,
    min: 0
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending'
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['bank', 'cash', 'cheque'],
      required: true
    },
    reference: String,
    date: Date
  }
});

const payrollSchema = new mongoose.Schema({
  payrollId: {
    type: String,
    required: true,
    unique: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  items: [payrollItemSchema],
  totalBasicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  totalGrossSalary: {
    type: Number,
    required: true,
    min: 0
  },
  totalDeductions: {
    type: Number,
    required: true,
    min: 0
  },
  totalNetSalary: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'processing', 'approved', 'completed'],
    default: 'draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
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

// Generate payroll ID before saving
payrollSchema.pre('save', async function(next) {
  if (!this.payrollId) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.payrollId = `PAY${year}${month}${count.toString().padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
payrollSchema.pre('save', function(next) {
  let totalBasic = 0;
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  this.items.forEach(item => {
    totalBasic += item.basicSalary;
    totalGross += item.grossSalary;
    totalDeductions += item.deductions.reduce((sum, d) => sum + d.amount, 0);
    totalNet += item.netSalary;
  });

  this.totalBasicSalary = totalBasic;
  this.totalGrossSalary = totalGross;
  this.totalDeductions = totalDeductions;
  this.totalNetSalary = totalNet;

  next();
});

module.exports = mongoose.model('Payroll', payrollSchema); 