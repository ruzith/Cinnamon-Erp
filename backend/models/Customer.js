const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema); 