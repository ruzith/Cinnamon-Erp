const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ManufacturingOrder = require('../models/ManufacturingOrder');

// Get all manufacturing orders
router.get('/', protect, async (req, res) => {
  try {
    const orders = await ManufacturingOrder.find()
      .populate('product')
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create manufacturing order
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const order = await ManufacturingOrder.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(
      await order
        .populate('product')
        .populate('assignedTo', 'firstName lastName')
        .populate('createdBy', 'name')
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update manufacturing order
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const order = await ManufacturingOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('product')
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'name');
    
    if (!order) {
      return res.status(404).json({ message: 'Manufacturing order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete manufacturing order
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await ManufacturingOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Manufacturing order not found' });
    }

    // Don't allow deletion of orders that are in progress or completed
    if (['in-progress', 'completed'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Cannot delete orders that are in progress or completed' 
      });
    }

    await order.remove();
    res.json({ message: 'Manufacturing order removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get manufacturing order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await ManufacturingOrder.findById(req.params.id)
      .populate('product')
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'name');
    
    if (!order) {
      return res.status(404).json({ message: 'Manufacturing order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 