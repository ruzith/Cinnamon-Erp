const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Task = require('../models/Task');

// Get all tasks
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create task
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(
      await task
        .populate('assignedTo', 'firstName lastName')
        .populate('createdBy', 'name')
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update task
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'name');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await task.remove();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 