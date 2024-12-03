const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Designation = require('../models/Designation');
const Employee = require('../models/Employee');

// Get all designations
router.get('/', protect, async (req, res) => {
  try {
    const designations = await Designation.find();
    res.json(designations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new designation
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title } = req.body;
    const designationExists = await Designation.findOne({ title });

    if (designationExists) {
      return res.status(400).json({ message: 'Designation already exists' });
    }

    const designation = await Designation.create(req.body);
    res.status(201).json(designation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update designation
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id);
    if (!designation) {
      return res.status(404).json({ message: 'Designation not found' });
    }

    const updatedDesignation = await Designation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedDesignation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete designation
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id);
    if (!designation) {
      return res.status(404).json({ message: 'Designation not found' });
    }

    // Check if any employees are using this designation
    const employeeCount = await Employee.countDocuments({ designation: req.params.id });
    if (employeeCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete designation that is assigned to employees' 
      });
    }

    await designation.remove();
    res.json({ message: 'Designation removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 