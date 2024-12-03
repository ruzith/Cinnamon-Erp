const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nic: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  birthday: {
    type: Date,
    required: true
  },
  designation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Designation',
    required: true
  },
  employmentType: {
    type: String,
    enum: ['permanent', 'temporary'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  salaryStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryStructure',
    required: true
  },
  bankDetails: {
    bankName: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    },
    accountName: {
      type: String,
      trim: true
    }
  }
});

module.exports = mongoose.model('Employee', employeeSchema); 