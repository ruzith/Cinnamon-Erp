const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Currency = require('../models/Currency');

// Get all currencies
router.get('/', protect, async (req, res) => {
  try {
    const currencies = await Currency.getAll();
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active currencies
router.get('/active', protect, async (req, res) => {
  try {
    const currencies = await Currency.getActive();
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create currency
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const id = await Currency.create(req.body);
    const currency = await Currency.getById(id);
    res.status(201).json(currency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update currency
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const success = await Currency.update(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ message: 'Currency not found' });
    }
    const currency = await Currency.getById(req.params.id);
    res.json(currency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete currency
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const success = await Currency.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Currency not found' });
    }
    res.json({ message: 'Currency removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 