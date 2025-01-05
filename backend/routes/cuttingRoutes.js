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
  getPaymentsByContractor,
  completeAssignment,
  createAdvancePayment,
  getAdvancePayments,
  getAdvancePaymentsByContractor,
  deletePayment,
  deleteAdvancePayment,
  updateAdvancePayment,
  updatePayment
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
router.get('/payments/:id', protect, async (req, res) => {
  try {
    const payment = await require('../models/domain/CuttingPayment').getWithDetails(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.put('/payments/:id', protect, authorize('admin', 'accountant'), updatePayment);
router.delete('/payments/:id', protect, authorize('admin', 'accountant'), deletePayment);

// Advance Payment routes
router.post('/advance-payments', protect, authorize('admin', 'accountant'), createAdvancePayment);
router.get('/advance-payments', protect, getAdvancePayments);
router.get('/advance-payments/contractor/:id', protect, getAdvancePaymentsByContractor);
router.put('/advance-payments/:id', protect, authorize('admin', 'accountant'), updateAdvancePayment);
router.delete('/advance-payments/:id', protect, authorize('admin', 'accountant'), deleteAdvancePayment);

// @route   POST /api/cutting/assignments/complete
router.post('/assignments/complete', completeAssignment);

// Add this route after other payment routes
router.post('/payments/receipt', protect, async (req, res) => {
  try {
    const { payment, settings } = req.body;
    const { generateCuttingPaymentReceipt } = require('../utils/receiptTemplates');
    const receiptHtml = generateCuttingPaymentReceipt(payment, settings);
    res.json({ receiptHtml });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;