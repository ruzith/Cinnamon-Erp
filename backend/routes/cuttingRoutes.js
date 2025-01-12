const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getContractors,
  getContractor,
  createContractor,
  updateContractor,
  deleteContractor,
  reassignContractor,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getPayments,
  getPayment,
  createPayment,
  getPaymentsByContractor,
  completeAssignment,
  createAdvancePayment,
  getAdvancePayments,
  getAdvancePaymentsByContractor,
  deletePayment,
  deleteAdvancePayment,
  updateAdvancePayment,
  updatePayment,
  generateReceipt,
  getContractorAdvancePayments,
  markAdvancePaymentAsPaid,
  markPaymentAsPaid
} = require('../controllers/cuttingController');

router.use(protect);

// Contractor routes
router.route('/contractors')
  .get(getContractors)
  .post(authorize('admin'), createContractor);

router.route('/contractors/:id')
  .get(getContractor)
  .put(authorize('admin'), updateContractor)
  .delete(authorize('admin'), deleteContractor);

// Add new reassignment route
router.route('/contractors/:id/reassign')
  .post(authorize('admin'), reassignContractor);

// Assignment routes
router.route('/assignments')
  .get(getAssignments)
  .post(authorize('admin'), createAssignment);

router.route('/assignments/:id')
  .put(authorize('admin'), updateAssignment)
  .delete(authorize('admin'), deleteAssignment);

router.route('/assignments/complete')
  .post(authorize('admin'), completeAssignment);

// Task routes
router.route('/tasks')
  .get(getTasks)
  .post(createTask);

router.route('/tasks/:id')
  .get(getTask)
  .put(updateTask)
  .delete(authorize('admin'), deleteTask);

// Payment routes
router.route('/payments')
  .get(getPayments)
  .post(authorize(['admin', 'accountant']), createPayment);

router.route('/payments/receipt')
  .post(generateReceipt);

router.route('/payments/:id')
  .get(getPayment)
  .put(authorize(['admin', 'accountant']), updatePayment)
  .delete(authorize(['admin', 'accountant']), deletePayment);

router.route('/payments/contractor/:id')
  .get(getPaymentsByContractor);

// Advance Payment routes
router.route('/advance-payments')
  .get(getAdvancePayments)
  .post(authorize(['admin', 'accountant']), createAdvancePayment);

router.route('/advance-payments/:id')
  .put(authorize(['admin', 'accountant']), updateAdvancePayment)
  .delete(authorize(['admin', 'accountant']), deleteAdvancePayment);

router.route('/advance-payments/contractor/:id')
  .get(getAdvancePaymentsByContractor);

// Add this route
router.get('/contractors/:id/advance-payments', protect, getContractorAdvancePayments);

// Add these new routes
router.put('/advance-payments/:id/mark-paid', markAdvancePaymentAsPaid);
router.put('/payments/:id/mark-paid', markPaymentAsPaid);

module.exports = router;