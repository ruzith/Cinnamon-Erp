const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getContractors,
  getContractor,
  createContractor,
  updateContractor,
  deleteContractor,
  createAssignment,
  updateAssignment,
  getAssignments,
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  deleteAssignment,
  createPayment,
  getPayments,
  getPaymentsByContractor
} = require('../controllers/cuttingController');

// Contractor routes
router.get('/contractors', protect, getContractors);
router.get('/contractors/:id', protect, getContractor);
router.post('/contractors', protect, authorize('admin', 'manager'), createContractor);
router.put('/contractors/:id', protect, authorize('admin', 'manager'), updateContractor);
router.delete('/contractors/:id', protect, authorize('admin'), deleteContractor);

// Assignment routes
router.get('/assignments', protect, getAssignments);
router.post('/assignments', protect, authorize('admin', 'manager'), createAssignment);
router.put('/assignments/:id', protect, authorize('admin', 'manager'), updateAssignment);
router.delete('/assignments/:id', protect, authorize('admin'), deleteAssignment);

// Task routes
router.get('/tasks', protect, getTasks);
router.post('/tasks', protect, createTask);
router.get('/tasks/:id', protect, getTask);
router.put('/tasks/:id', protect, updateTask);
router.delete('/tasks/:id', protect, authorize('admin'), deleteTask);

// Payment routes
router.post('/payments', protect, authorize('admin', 'accountant'), createPayment);
router.get('/payments', protect, getPayments);
router.get('/payments/contractor/:id', protect, getPaymentsByContractor);

module.exports = router; 