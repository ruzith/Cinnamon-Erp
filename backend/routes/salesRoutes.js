const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const SalesInvoice = require('../models/SalesInvoice');
const Inventory = require('../models/Inventory');
const { validateSalesInvoice } = require('../validators/salesValidator');

// Get all sales invoices
router.get('/', protect, async (req, res) => {
  try {
    const [invoices] = await SalesInvoice.pool.execute(`
      SELECT si.*, 
             u.name as created_by_name,
             COUNT(sit.id) as total_items
      FROM sales_invoices si
      LEFT JOIN users u ON si.created_by = u.id
      LEFT JOIN sales_items sit ON si.id = sit.invoice_id
      GROUP BY si.id
      ORDER BY si.date DESC
    `);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create sales invoice
router.post('/', protect, authorize('admin', 'manager', 'sales'), async (req, res) => {
  try {
    const { error } = validateSalesInvoice(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check stock availability
    for (const item of req.body.items) {
      const [product] = await Inventory.pool.execute(
        'SELECT * FROM inventory WHERE id = ?',
        [item.product_id]
      );
      
      if (!product[0]) {
        return res.status(404).json({ message: `Product not found: ${item.product_id}` });
      }
      
      if (product[0].quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product: ${product[0].product_name}`
        });
      }
    }

    const invoice = await SalesInvoice.createWithItems(
      { ...req.body, created_by: req.user.id },
      req.body.items
    );
    
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 