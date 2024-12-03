const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const SalesInvoice = require('../models/SalesInvoice');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');

// Get all sales invoices
router.get('/', protect, async (req, res) => {
  try {
    const invoices = await SalesInvoice.find()
      .populate('items.product')
      .populate('createdBy', 'name')
      .sort('-date');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create sales invoice
router.post('/', protect, authorize('admin', 'manager', 'sales'), async (req, res) => {
  try {
    const invoice = new SalesInvoice({
      ...req.body,
      createdBy: req.user.id
    });

    // Check stock availability and create inventory transactions
    for (const item of invoice.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }
      if (product.currentStock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product: ${product.name}`
        });
      }
    }

    // If invoice is confirmed, update inventory
    if (req.body.status === 'confirmed') {
      for (const item of invoice.items) {
        // Create inventory transaction
        await InventoryTransaction.create({
          product: item.product,
          type: 'sale',
          quantity: item.quantity,
          reference: invoice.invoiceNumber,
          createdBy: req.user.id
        });

        // Update product stock
        await Product.findByIdAndUpdate(item.product, {
          $inc: { currentStock: -item.quantity }
        });
      }
    }

    await invoice.save();
    res.status(201).json(
      await invoice
        .populate('items.product')
        .populate('createdBy', 'name')
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update sales invoice
router.put('/:id', protect, async (req, res) => {
  try {
    const invoice = await SalesInvoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Don't allow editing confirmed invoices
    if (invoice.status === 'confirmed') {
      return res.status(400).json({ message: 'Cannot edit confirmed invoice' });
    }

    const updatedInvoice = await SalesInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('items.product').populate('createdBy', 'name');

    // If status changed to confirmed, update inventory
    if (req.body.status === 'confirmed' && invoice.status !== 'confirmed') {
      for (const item of updatedInvoice.items) {
        await InventoryTransaction.create({
          product: item.product,
          type: 'sale',
          quantity: item.quantity,
          reference: updatedInvoice.invoiceNumber,
          createdBy: req.user.id
        });

        await Product.findByIdAndUpdate(item.product, {
          $inc: { currentStock: -item.quantity }
        });
      }
    }

    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get invoice by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await SalesInvoice.findById(req.params.id)
      .populate('items.product')
      .populate('createdBy', 'name');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 