const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ManufacturingContractor = require('../models/ManufacturingContractor');
const CinnamonAssignment = require('../models/CinnamonAssignment');
const AdvancePayment = require('../models/AdvancePayment');

// Get all contractors
router.get('/contractors', protect, async (req, res) => {
  try {
    const contractors = await ManufacturingContractor.find();
    res.json(contractors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new contractor
router.post('/contractors', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const contractor = await ManufacturingContractor.create(req.body);
    res.status(201).json(contractor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update contractor
router.put('/contractors/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const contractor = await ManufacturingContractor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }
    res.json(contractor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete contractor
router.delete('/contractors/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const contractor = await ManufacturingContractor.findById(req.params.id);
    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }
    await contractor.remove();
    res.json({ message: 'Contractor removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign cinnamon to contractor
router.post('/assignments', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const assignment = await CinnamonAssignment.create(req.body);
    res.status(201).json(await assignment.populate('contractor'));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update cinnamon assignment
router.put('/assignments/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const assignment = await CinnamonAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('contractor');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create advance payment
router.post('/advance-payments', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const payment = await AdvancePayment.create(req.body);
    res.status(201).json(await payment.populate('contractor'));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get contractor's advance payments
router.get('/advance-payments/contractor/:contractorId', protect, async (req, res) => {
  try {
    const payments = await AdvancePayment.find({ contractor: req.params.contractorId })
      .populate('contractor')
      .sort('-paymentDate');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get contractor's assignments
router.get('/assignments/contractor/:contractorId', protect, async (req, res) => {
  try {
    const assignments = await CinnamonAssignment.find({ contractor: req.params.contractorId })
      .populate('contractor')
      .sort('-startDate');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 