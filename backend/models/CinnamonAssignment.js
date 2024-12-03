const mongoose = require('mongoose');

const cinnamonAssignmentSchema = new mongoose.Schema({
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManufacturingContractor',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'g'],
    default: 'kg'
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  durationType: {
    type: String,
    enum: ['day', 'week', 'month'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  expectedEndDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
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

module.exports = mongoose.model('CinnamonAssignment', cinnamonAssignmentSchema); 