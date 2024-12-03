const mongoose = require('mongoose');

const cuttingTaskSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandAssignment',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  progress: {
    type: Number, // Percentage of completion
    required: true,
    min: 0,
    max: 100
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

module.exports = mongoose.model('CuttingTask', cuttingTaskSchema); 