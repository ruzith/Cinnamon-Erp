const mongoose = require('mongoose');

const manufacturingContractorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contractorId: {
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

module.exports = mongoose.model('ManufacturingContractor', manufacturingContractorSchema); 