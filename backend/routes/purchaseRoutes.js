const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Grade = require('../models/domain/Grade');
const PurchaseInvoice = require('../models/domain/PurchaseInvoice');
const CuttingPayment = require('../models/domain/CuttingPayment');
const AdvancePayment = require('../models/domain/AdvancePayment');

// Grade routes
router.get('/grades', protect, async (req, res) => {
  try {
    const grades = await Grade.getActiveGrades();
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/grades', protect, authorize('admin'), async (req, res) => {
  try {
    const grade = await Grade.create(req.body);
    res.status(201).json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Purchase Invoice routes
router.post('/invoices', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const invoice = new PurchaseInvoice(req.body);
    
    // If invoice is confirmed, create cutting payment
    if (req.body.status === 'confirmed') {
      const cuttingPayment = await CuttingPayment.create({
        contractor: invoice.contractor,
        amount: invoice.cuttingCharges,
        status: 'pending',
        notes: `Generated from Purchase Invoice ${invoice.invoiceNumber}`
      });
    }
    
    await invoice.save();
    res.status(201).json(await invoice.populate(['contractor', 'items.grade', 'advancePayments']));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/invoices/:id', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const invoice = await PurchaseInvoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Don't allow editing confirmed invoices
    if (invoice.status === 'confirmed') {
      return res.status(400).json({ message: 'Cannot edit confirmed invoice' });
    }

    const updatedInvoice = await PurchaseInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate(['contractor', 'items.grade', 'advancePayments']);

    // If status changed to confirmed, create cutting payment
    if (req.body.status === 'confirmed' && invoice.status !== 'confirmed') {
      await CuttingPayment.create({
        contractor: updatedInvoice.contractor,
        amount: updatedInvoice.cuttingCharges,
        status: 'pending',
        notes: `Generated from Purchase Invoice ${updatedInvoice.invoiceNumber}`
      });
    }

    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/invoices/contractor/:contractorId', protect, async (req, res) => {
  try {
    const invoices = await PurchaseInvoice.find({ contractor: req.params.contractorId })
      .populate(['contractor', 'items.grade', 'advancePayments'])
      .sort('-date');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add route to get advance payments for a contractor
router.get('/advance-payments/contractor/:contractorId', protect, async (req, res) => {
  try {
    const payments = await AdvancePayment.find({ 
      contractor: req.params.contractorId,
      status: { $ne: 'used' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 