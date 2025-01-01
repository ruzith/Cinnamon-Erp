const express = require('express');
const router = express.Router();
const TaskCategory = require('../models/domain/TaskCategory');
const { validateTaskCategory } = require('../validators/taskCategoryValidator');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all task categories
router.get('/', protect, async (req, res) => {
  try {
    const categories = await TaskCategory.getAll();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching task categories:', error);
    res.status(500).json({ message: 'Error fetching task categories' });
  }
});

// Create a new task category
router.post('/', protect, authorize('admin', 'manager'), validateTaskCategory, async (req, res) => {
  try {
    const category = await TaskCategory.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating task category:', error);
    res.status(500).json({ message: 'Error creating task category' });
  }
});

// Update a task category
router.put('/:id', protect, authorize('admin', 'manager'), validateTaskCategory, async (req, res) => {
  try {
    const category = await TaskCategory.update(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ message: 'Task category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error updating task category:', error);
    res.status(500).json({ message: 'Error updating task category' });
  }
});

// Delete a task category
router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    await TaskCategory.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task category:', error);
    res.status(500).json({ message: 'Error deleting task category' });
  }
});

module.exports = router;