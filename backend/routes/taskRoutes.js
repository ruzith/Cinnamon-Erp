const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Task = require('../models/domain/Task');

// Get all tasks
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all task reports
router.get('/reports', protect, async (req, res) => {
  try {
    const { employee, startDate, endDate, category } = req.query;
    let tasks = await Task.getAllTasks();

    // Apply filters
    if (tasks.length > 0) {
      // Filter by employee
      if (employee) {
        tasks = tasks.filter(task => task.assigned_to?.toString() === employee);
      }

      // Filter by date range
      if (startDate && endDate) {
        tasks = tasks.filter(task => {
          const taskDate = new Date(task.created_at);
          return taskDate >= new Date(startDate) && taskDate <= new Date(endDate);
        });
      }

      // Filter by category
      if (category) {
        tasks = tasks.filter(task => task.category_id?.toString() === category);
      }
    }

    // Get reports for filtered tasks
    const reports = await Promise.all(
      tasks.map(async (task) => {
        try {
          const report = await Task.getTaskReport(task.id);
          return report;
        } catch (error) {
          console.error(`Error getting report for task ${task.id}:`, error);
          return null;
        }
      })
    );

    // Filter out any null reports (in case of errors)
    const validReports = reports.filter(report => report !== null);
    res.json(validReports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create task
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      created_by: req.user.id
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update task
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const task = await Task.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const task = await Task.delete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task removed' });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get task report
router.get('/:id/report', protect, async (req, res) => {
  try {
    const report = await Task.getTaskReport(req.params.id);
    res.json(report);
  } catch (error) {
    if (error.message === 'Task not found') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

module.exports = router;