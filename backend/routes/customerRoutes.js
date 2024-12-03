const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Customer = require('../models/Customer');

// Get all customers
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate('createdBy', 'name')
      .sort('name');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create customer
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(await customer.populate('createdBy', 'name'));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update customer
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('createdBy', 'name');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Don't allow deletion if customer has outstanding balance
    if (customer.currentBalance !== 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer with outstanding balance' 
      });
    }

    await customer.remove();
    res.json({ message: 'Customer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 