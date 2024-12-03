const mongoose = require('mongoose');

const reportFilterSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'date', 'number', 'select', 'boolean'],
    required: true
  },
  label: {
    en: String,
    si: String
  },
  options: [{
    value: String,
    label: {
      en: String,
      si: String
    }
  }],
  defaultValue: mongoose.Schema.Types.Mixed
});

const reportColumnSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true
  },
  header: {
    en: String,
    si: String
  },
  width: Number,
  sortable: {
    type: Boolean,
    default: true
  },
  format: {
    type: String,
    enum: ['text', 'date', 'number', 'currency', 'percentage'],
    default: 'text'
  }
});

const reportSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    en: {
      type: String,
      required: true
    },
    si: String
  },
  category: {
    type: String,
    enum: [
      'tasks', 
      'employees', 
      'financials', 
      'sales', 
      'manufacturing', 
      'cutting', 
      'assets', 
      'inventory'
    ],
    required: true
  },
  description: {
    en: String,
    si: String
  },
  filters: [reportFilterSchema],
  columns: [reportColumnSchema],
  query: {
    type: String, // MongoDB aggregation pipeline as string
    required: true
  },
  sortBy: {
    field: String,
    order: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'asc'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema); 