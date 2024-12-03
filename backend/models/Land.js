const mongoose = require('mongoose');

const landSchema = new mongoose.Schema({
  parcelNumber: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  area: {
    type: Number,
    required: true
  },
  areaUnit: {
    type: String,
    required: true,
    enum: ['hectares', 'acres', 'square_meters']
  },
  acquisitionDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'under_maintenance']
  },
  forestType: {
    type: String,
    required: true
  },
  soilType: String,
  lastHarvestDate: Date,
  nextHarvestDate: Date,
  notes: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Land', landSchema); 