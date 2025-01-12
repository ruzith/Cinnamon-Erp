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
  deleteAssignment,
  getAdvancePayments,
  createAdvancePayment,
  getContractorAdvancePayments,
  startProduction,
  completeProduction,
  getMaterialRequirements,
  generateOrderReceipt,
  markOrderAsPaid,
  printInvoice,
  getAssignmentReports,
  printAssignmentReport,
  getManufacturingInvoices,
  getPurchases,
  createPurchaseInvoice
} = require('../controllers/manufacturingController');
const ManufacturingOrder = require('../models/domain/ManufacturingOrder');
const { validateOrder } = require('../validators/manufacturingValidator');

// Manufacturing order routes
router.get('/orders', protect, async (req, res) => {
  try {
    const orders = await ManufacturingOrder.getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/orders', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { error } = validateOrder(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const order = await ManufacturingOrder.create({
      ...req.body,
      created_by: req.user.id
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/orders/:id', protect, async (req, res) => {
  try {
    const order = await ManufacturingOrder.getWithDetails(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Manufacturing order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/orders/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const order = await ManufacturingOrder.update(req.params.id, req.body);
    if (!order) {
      return res.status(404).json({ message: 'Manufacturing order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/orders/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { forceDelete } = req.query;
    await ManufacturingOrder.delete(req.params.id, forceDelete === 'true');
    res.json({ message: 'Manufacturing order removed' });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

router.get('/orders/:id/receipt', protect, generateOrderReceipt);
router.put('/orders/:id/mark-paid', protect, authorize('admin', 'accountant'), markOrderAsPaid);

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
router.delete('/assignments/:id', protect, authorize('admin', 'manager'), deleteAssignment);
router.get('/assignments/:id/report', protect, printAssignmentReport);
router.get('/reports/assignments', protect, getAssignmentReports);

// Advance payment routes
router.get('/advance-payments', protect, getAdvancePayments);
router.post('/advance-payments', protect, authorize('admin', 'accountant'), createAdvancePayment);
router.get('/contractors/:id/advance-payments', protect, getContractorAdvancePayments);

// Production routes
router.post('/start-production', protect, authorize('admin', 'manager'), startProduction);
router.post('/complete-production', protect, authorize('admin', 'manager'), completeProduction);
router.get('/material-requirements/:orderId', protect, getMaterialRequirements);

// Invoice routes
router.get('/invoices', protect, getManufacturingInvoices);
router.get('/invoices/:id/print', protect, printInvoice);

// Purchases routes
router.get('/purchases', protect, getPurchases);
router.post('/purchase-invoices', protect, authorize('admin', 'manager'), createPurchaseInvoice);

module.exports = router;