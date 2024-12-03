const mongoose = require('mongoose');

const salesItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  subTotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const salesInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
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
    }
  },
  items: [salesItemSchema],
  subTotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank-transfer', 'other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'cancelled'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate invoice number before saving
salesInvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.invoiceNumber = `SAL${year}${month}${count.toString().padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
salesInvoiceSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subTotal = this.items.reduce((sum, item) => sum + item.subTotal, 0);
  
  // Calculate total with discount and tax
  let total = this.subTotal;
  if (this.discount) {
    total -= this.discount;
  }
  if (this.tax) {
    total += (total * this.tax) / 100;
  }
  this.total = total;
  
  next();
});

module.exports = mongoose.model('SalesInvoice', salesInvoiceSchema); 