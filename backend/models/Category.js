const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'asset', 'inventory']
  },
  description: String,
  status: {
    type: String,
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema); 