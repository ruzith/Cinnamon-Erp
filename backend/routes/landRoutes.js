const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Land = require('../models/Land');
const { authorize } = require('../middleware/authMiddleware');

// Get all lands
router.get('/', protect, async (req, res) => {
  try {
    const lands = await Land.find();
    res.json(lands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new land
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const land = new Land({
      ...req.body,
      user: req.user.id
    });
    const savedLand = await land.save();
    res.status(201).json(savedLand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update land
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({ message: 'Land not found' });
    }
    
    const updatedLand = await Land.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedLand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete land
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({ message: 'Land not found' });
    }

    await Land.findByIdAndDelete(req.params.id);
    res.json({ message: 'Land removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 