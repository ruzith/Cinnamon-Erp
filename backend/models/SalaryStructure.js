const mongoose = require('mongoose');

const salaryComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['earning', 'deduction'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  isPercentage: {
    type: Boolean,
    default: false
  },
  calculatedOn: {
    type: String,
    enum: ['basic', 'gross'],
    default: 'basic'
  }
});

const salaryStructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  components: [salaryComponentSchema],
  description: {
    type: String,
    trim: true
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

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema); 