const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ManufacturingOrder = require('../models/ManufacturingOrder');
const { validateOrder } = require('../validators/manufacturingValidator');

// Get all manufacturing orders
router.get('/', protect, async (req, res) => {
  try {
    const orders = await ManufacturingOrder.getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create manufacturing order
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { error } = validateOrder(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const order = await ManufacturingOrder.create({
      ...req.body,
      created_by: req.user.id
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update manufacturing order
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const order = await ManufacturingOrder.update(req.params.id, req.body);
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
    await ManufacturingOrder.delete(req.params.id);
    res.json({ message: 'Manufacturing order removed' });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get manufacturing order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await ManufacturingOrder.getWithDetails(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Manufacturing order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 