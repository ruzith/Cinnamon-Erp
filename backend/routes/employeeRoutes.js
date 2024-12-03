const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Employee = require('../models/Employee');

// Get all employees
router.get('/', protect, async (req, res) => {
  try {
    const employees = await Employee.find().populate('designation');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new employee
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { nic } = req.body;
    const employeeExists = await Employee.findOne({ nic });

    if (employeeExists) {
      return res.status(400).json({ message: 'Employee with this NIC already exists' });
    }

    const employee = await Employee.create(req.body);
    res.status(201).json(await employee.populate('designation'));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update employee
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('designation');

    res.json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete employee
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await employee.remove();
    res.json({ message: 'Employee removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 