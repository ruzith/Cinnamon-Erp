const mongoose = require('mongoose');

const landAssignmentSchema = new mongoose.Schema({
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CuttingContractor',
    required: true
  },
  land: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Land',
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
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LandAssignment', landAssignmentSchema); 