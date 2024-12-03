const mongoose = require('mongoose');

const wellSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease',
    required: true
  },
  status: {
    type: String,
    enum: ['producing', 'shut-in', 'abandoned'],
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  depth: {
    type: Number,
    required: true
  },
  production: {
    oil: Number,
    gas: Number,
    water: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Well', wellSchema); 