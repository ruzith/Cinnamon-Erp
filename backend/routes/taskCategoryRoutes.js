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
    if (error.hasTasks) {
      return res.status(400).json({
        message: 'Cannot delete category that has tasks assigned to it',
        hasTasks: true
      });
    }
    res.status(500).json({ message: 'Error deleting task category' });
  }
});

// Reassign tasks and delete category
router.post('/:id/reassign', protect, authorize('admin', 'manager'), async (req, res) => {
  const { newCategoryId } = req.body;
  const oldCategoryId = req.params.id;
  let connection;

  try {
    // Get a connection from the pool
    connection = await TaskCategory.pool.getConnection();

    // Start a transaction
    await connection.beginTransaction();

    // Update all tasks with the old category to use the new category
    await connection.execute(
      'UPDATE tasks SET category_id = ? WHERE category_id = ?',
      [newCategoryId, oldCategoryId]
    );

    // Delete the old category
    await connection.execute(
      'DELETE FROM task_categories WHERE id = ?',
      [oldCategoryId]
    );

    // Commit the transaction
    await connection.commit();

    res.status(200).json({ message: 'Tasks reassigned and category deleted successfully' });
  } catch (error) {
    // Rollback in case of error
    if (connection) {
      await connection.rollback();
    }
    console.error('Error in category reassignment:', error);
    res.status(500).json({ message: 'Error reassigning tasks and deleting category' });
  } finally {
    // Release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;