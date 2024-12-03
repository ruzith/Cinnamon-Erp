const mongoose = require('mongoose');

const leaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  lessor: {
    type: String,
    required: true
  },
  lessee: {
    type: String,
    required: true
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  acreage: {
    type: Number,
    required: true
  },
  royaltyRate: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'pending'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lease', leaseSchema); 