const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const CuttingContractor = require('../models/CuttingContractor');
const LandAssignment = require('../models/LandAssignment');
const CuttingTask = require('../models/CuttingTask');
const CuttingPayment = require('../models/CuttingPayment');

// Get all contractors
router.get('/contractors', protect, async (req, res) => {
  try {
    const contractors = await CuttingContractor.find();
    res.json(contractors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new contractor
router.post('/contractors', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const contractor = await CuttingContractor.create(req.body);
    res.status(201).json(contractor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Assign land to contractor
router.post('/assignments', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const assignment = await LandAssignment.create(req.body);
    res.status(201).json(await assignment.populate(['contractor', 'land']));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Record daily task progress
router.post('/tasks', protect, async (req, res) => {
  try {
    const task = await CuttingTask.create(req.body);
    res.status(201).json(await task.populate('assignment'));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create payment record
router.post('/payments', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const payment = await CuttingPayment.create(req.body);
    res.status(201).json(await payment.populate(['contractor', 'assignment']));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update payment status
router.put('/payments/:id', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const payment = await CuttingPayment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, paymentDate: req.body.status === 'paid' ? Date.now() : null },
      { new: true }
    ).populate(['contractor', 'assignment']);
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get contractor payments
router.get('/payments/contractor/:contractorId', protect, async (req, res) => {
  try {
    const payments = await CuttingPayment.find({ contractor: req.params.contractorId })
      .populate(['contractor', 'assignment']);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 