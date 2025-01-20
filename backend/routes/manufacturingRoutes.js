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
  createPurchaseInvoice,
  markPurchaseAsPaid,
  updateAssignmentStatus,
  completeAssignment,
  markAdvancePaymentAsPaid,
  updateAdvancePayment,
  deleteAdvancePayment,
  getContractorRelatedData
} = require('../controllers/manufacturingController');
const ManufacturingOrder = require('../models/domain/ManufacturingOrder');
const { validateOrder } = require('../validators/manufacturingValidator');
const { pool } = require('../config/db');
const { generateManufacturingPaymentReceipt, generateAdvancePaymentReceipt } = require('../utils/receiptTemplates');

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
router.get('/contractors/:id/related-data', protect, getContractorRelatedData);

// Assignment routes
router.get('/assignments', protect, getAssignments);
router.post('/assignments', protect, authorize('admin', 'manager'), createAssignment);
router.put('/assignments/:id', protect, authorize('admin', 'manager'), updateAssignment);
router.delete('/assignments/:id', protect, authorize('admin', 'manager'), deleteAssignment);
router.get('/assignments/:id/report', protect, printAssignmentReport);
router.get('/reports/assignments', protect, getAssignmentReports);
router.put('/assignments/:id/status', protect, authorize('admin', 'manager'), updateAssignmentStatus);
router.post('/assignments/complete', protect, authorize('admin'), completeAssignment);

// Advance payment routes
router.get('/advance-payments', protect, getAdvancePayments);
router.post('/advance-payments', protect, authorize('admin', 'accountant'), createAdvancePayment);
router.get('/contractors/:id/advance-payments', protect, getContractorAdvancePayments);
router.put('/advance-payments/:id/mark-paid', protect, authorize('admin', 'accountant'), markAdvancePaymentAsPaid);
router.put('/advance-payments/:id', protect, authorize('admin', 'accountant'), updateAdvancePayment);
router.delete('/advance-payments/:id', protect, authorize('admin', 'accountant'), deleteAdvancePayment);
router.post('/advance-payments/receipt', protect, async (req, res) => {
  try {
    const { payment, settings } = req.body;
    const receiptHtml = generateAdvancePaymentReceipt(payment, settings);
    res.json({ receiptHtml });
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ message: 'Error generating receipt' });
  }
});

// Manufacturing payment routes
router.get('/payments', protect, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT mp.*, mc.name as contractor_name, ca.raw_material_quantity
      FROM manufacturing_payments mp
      JOIN manufacturing_contractors mc ON mp.contractor_id = mc.id
      JOIN cinnamon_assignments ca ON mp.assignment_id = ca.id
      ORDER BY mp.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/payments', protect, authorize('admin', 'accountant'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      contractor_id,
      assignment_id,
      quantity_kg,
      price_per_kg,
      amount,
      notes,
      advance_payment_ids = []
    } = req.body;

    // Generate receipt number
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const [result] = await connection.execute(
      'SELECT COUNT(*) as count FROM manufacturing_payments WHERE YEAR(created_at) = YEAR(CURRENT_TIMESTAMP)'
    );
    const count = result[0].count + 1;
    const receipt_number = `MP${year}${count.toString().padStart(4, '0')}`;

    // Insert payment
    const [payment] = await connection.execute(
      `INSERT INTO manufacturing_payments
       (contractor_id, assignment_id, receipt_number, quantity_kg, price_per_kg, amount, payment_date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, ?)`,
      [contractor_id, assignment_id, receipt_number, quantity_kg, price_per_kg, amount, notes, req.user.id]
    );

    // Process advance payments if any
    if (advance_payment_ids.length > 0) {
      for (const advanceId of advance_payment_ids) {
        // Update advance payment status
        await connection.execute(
          `UPDATE manufacturing_advance_payments
           SET status = 'used'
           WHERE id = ?`,
          [advanceId]
        );

        // Get advance payment amount
        const [advancePayment] = await connection.execute(
          'SELECT amount FROM manufacturing_advance_payments WHERE id = ?',
          [advanceId]
        );

        // Create payment usage record
        await connection.execute(
          `INSERT INTO manufacturing_payment_usages
           (payment_id, advance_payment_id, amount_used)
           VALUES (?, ?, ?)`,
          [payment.insertId, advanceId, advancePayment[0].amount]
        );
      }
    }

    await connection.commit();
    res.status(201).json({
      message: 'Payment processed successfully',
      payment: {
        id: payment.insertId,
        receipt_number
      }
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

router.put('/payments/:id/mark-paid', protect, authorize('admin', 'accountant'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      'UPDATE manufacturing_payments SET status = "paid" WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: 'Payment marked as paid successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

router.put('/payments/:id', protect, authorize('admin', 'accountant'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { quantity_kg, price_per_kg, amount, notes } = req.body;

    await connection.execute(
      `UPDATE manufacturing_payments
       SET quantity_kg = ?, price_per_kg = ?, amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [quantity_kg, price_per_kg, amount, notes, req.params.id]
    );

    await connection.commit();
    res.json({ message: 'Payment updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

router.delete('/payments/:id', protect, authorize('admin'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete payment usages first
    await connection.execute(
      'DELETE FROM manufacturing_payment_usages WHERE payment_id = ?',
      [req.params.id]
    );

    // Then delete the payment
    await connection.execute(
      'DELETE FROM manufacturing_payments WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// Update the receipt route
router.post('/payments/receipt', protect, async (req, res) => {
  try {
    const { payment, settings } = req.body;
    const receiptHtml = generateManufacturingPaymentReceipt(payment, settings);
    res.json({ receiptHtml });
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ message: 'Error generating receipt' });
  }
});

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
router.put('/purchases/:id/mark-paid', protect, authorize('admin', 'accountant'), markPurchaseAsPaid);

module.exports = router;