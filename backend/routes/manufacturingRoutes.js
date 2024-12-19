const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getContractors,
  getContractor,
  createContractor,
  updateContractor,
  deleteContractor,
  getAssignments,
  createAssignment,
  updateAssignment,
  getAdvancePayments,
  createAdvancePayment,
  startProduction,
  completeProduction,
  getMaterialRequirements
} = require('../controllers/manufacturingController');

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

// Advance payment routes
router.get('/advance-payments', protect, getAdvancePayments);
router.post('/advance-payments', protect, authorize('admin', 'accountant'), createAdvancePayment);

// Production routes
router.post('/start-production', protect, authorize('admin', 'manager'), startProduction);
router.post('/complete-production', protect, authorize('admin', 'manager'), completeProduction);
router.get('/material-requirements/:orderId', protect, getMaterialRequirements);

module.exports = router; 