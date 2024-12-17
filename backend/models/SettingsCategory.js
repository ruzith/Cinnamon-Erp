const mongoose = require('mongoose');

const settingsCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  order: {
    type: Number,
    default: 0
  },
  settings: [{
    key: {
      type: String,
      required: true
    },
    label: String,
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select', 'date'],
      required: true
    },
    options: [{ // For select type
      value: String,
      label: String
    }],
    defaultValue: mongoose.Schema.Types.Mixed,
    required: Boolean,
    validation: {
      min: Number,
      max: Number,
      pattern: String
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('SettingsCategory', settingsCategorySchema); 