const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    default: 1
  }
});

const settingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  companyAddress: {
    type: String,
    required: true
  },
  companyPhone: {
    type: String,
    required: true
  },
  vatNumber: {
    type: String
  },
  taxNumber: {
    type: String
  },
  logo: {
    type: String // URL to the logo image
  },
  language: {
    type: String,
    enum: ['en', 'si'],
    default: 'en'
  },
  currencies: [currencySchema],
  defaultCurrency: {
    type: String,
    ref: 'currencies.code',
    default: 'USD'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema); 