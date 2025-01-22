const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const SalesInvoice = require('../models/domain/SalesInvoice');
const Inventory = require('../models/domain/Inventory');
const { validateSalesInvoice } = require('../validators/salesValidator');
const PDFDocument = require('pdfkit');
const Customer = require('../models/domain/Customer');
const pool = require('../config/database');
const db = require('../config/database');
const { generateSalesInvoice } = require('../utils/pdfTemplates');

// Get all sales invoices
router.get('/', protect, async (req, res) => {
  try {
    const [invoices] = await SalesInvoice.pool.execute(`
      SELECT si.*,
             u.name as created_by_name,
             c.id as customer_id,
             COUNT(sit.id) as total_items
      FROM sales_invoices si
      LEFT JOIN users u ON si.created_by = u.id
      LEFT JOIN customers c ON c.name = si.customer_name
        AND c.phone = si.customer_phone
      LEFT JOIN sales_items sit ON si.id = sit.invoice_id
      GROUP BY si.id, u.name, c.id
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
    // Validate the request body first
    const { error } = validateSalesInvoice(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Get customer details
    const [customer] = await Customer.pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [req.body.customer_id]
    );

    if (!customer[0]) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Add customer details to invoice data after validation
    const invoiceData = {
      ...req.body,
      customer_name: customer[0].name,
      customer_address: customer[0].address,
      customer_phone: customer[0].phone,
      customer_email: customer[0].email,
      created_by: req.user.id
    };

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
      invoiceData,
      req.body.items
    );

    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get sale items
router.get('/:id/items', protect, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [items] = await connection.execute(`
        SELECT si.*, p.product_name, p.unit
        FROM sales_items si
        LEFT JOIN inventory p ON si.product_id = p.id
        WHERE si.invoice_id = ?
      `, [req.params.id]);

      res.json(items);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching sale items:', error);
    res.status(500).json({ message: 'Error fetching sale items' });
  }
});

// Update this route handler
router.get('/:id/print', protect, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      // Get sale details
      const [saleResult] = await connection.execute(
        `SELECT * FROM sales_invoices WHERE id = ?`,
        [req.params.id]
      );

      if (!saleResult.length) {
        return res.status(404).json({ message: 'Sale not found' });
      }

      const sale = saleResult[0];

      // Get sale items
      const [items] = await connection.execute(
        `SELECT si.*, p.product_name, p.unit
         FROM sales_items si
         LEFT JOIN inventory p ON si.product_id = p.id
         WHERE si.invoice_id = ?`,
        [req.params.id]
      );

      // Get company settings and currency
      const [settingsResult] = await connection.execute(`
        SELECT s.*, c.symbol as currency_symbol
        FROM settings s
        JOIN currencies c ON s.default_currency = c.id
        WHERE c.status = 'active'
        LIMIT 1
      `);
      const settings = settingsResult[0] || {};

      // Generate invoice HTML using the template
      const invoiceHtml = await generateSalesInvoice(sale, settings, items);

      res.json({ invoiceHtml });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      message: 'Error generating invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a sale
router.put('/:id', protect, async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get the original sale and items for comparison
    const [originalSale] = await connection.query(
      'SELECT status FROM sales_invoices WHERE id = ?',
      [req.params.id]
    );

    const [originalItems] = await connection.query(
      'SELECT product_id, quantity FROM sales_items WHERE invoice_id = ?',
      [req.params.id]
    );

    const {
      customer_id,
      items,
      status,
      payment_status,
      payment_method,
      notes,
      shipping_address,
      tax,
      discount,
      sub_total,
      total,
      date
    } = req.body;

    // First update the sales_invoice
    const [invoice] = await connection.query(
      `UPDATE sales_invoices
       SET customer_name = (SELECT name FROM customers WHERE id = ?),
           customer_address = (SELECT address FROM customers WHERE id = ?),
           customer_phone = (SELECT phone FROM customers WHERE id = ?),
           customer_email = (SELECT email FROM customers WHERE id = ?),
           sub_total = ?,
           discount = ?,
           tax = ?,
           total = ?,
           payment_method = ?,
           payment_status = ?,
           notes = ?,
           status = ?,
           date = ?
       WHERE id = ?`,
      [
        customer_id, customer_id, customer_id, customer_id,
        sub_total,
        discount,
        tax,
        total,
        payment_method,
        payment_status,
        notes,
        status,
        date,
        req.params.id
      ]
    );

    // Delete existing items
    await connection.query(
      'DELETE FROM sales_items WHERE invoice_id = ?',
      [req.params.id]
    );

    // If the original sale was confirmed, restore the inventory
    if (originalSale[0].status === 'confirmed') {
      for (const item of originalItems) {
        await connection.query(
          `UPDATE inventory
           SET quantity = quantity + ?
           WHERE id = ?`,
          [item.quantity, item.product_id]
        );

        // Record inventory transaction for reversal
        await connection.query(
          `INSERT INTO inventory_transactions
           (item_id, type, quantity, reference, notes)
           VALUES (?, ?, ?, ?, ?)`,
          [
            item.product_id,
            'IN',
            item.quantity,
            `${req.params.id}-REV`,
            `Sale Update Reversed for invoice ${req.params.id}`
          ]
        );
      }
    }

    // Insert new items and update inventory if confirmed
    for (const item of items) {
      await connection.query(
        `INSERT INTO sales_items
         (invoice_id, product_id, quantity, unit_price, discount, sub_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.params.id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.discount || 0,
          item.sub_total
        ]
      );

      if (req.body.status === 'confirmed') {
        // Update inventory quantity
        await connection.query(
          `UPDATE inventory
           SET quantity = quantity - ?
           WHERE id = ?`,
          [item.quantity, item.product_id]
        );

        // Record inventory transaction
        await connection.query(
          `INSERT INTO inventory_transactions
           (item_id, type, quantity, reference, notes)
           VALUES (?, ?, ?, ?, ?)`,
          [
            item.product_id,
            'OUT',
            item.quantity,
            `${req.params.id}-UPD`,
            `Sale Updated for invoice ${req.params.id}`
          ]
        );
      }
    }

    await connection.commit();
    res.json({
      message: 'Sale updated successfully',
      id: req.params.id
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating sale:', error);
    res.status(500).json({
      message: 'Error updating sale',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Get sale items
router.get('/:id/items', protect, async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT si.*, i.product_name
       FROM sales_items si
       JOIN inventory i ON si.product_id = i.id
       WHERE si.invoice_id = ?`,
      [req.params.id]
    );

    res.json(items);
  } catch (error) {
    console.error('Error fetching sale items:', error);
    res.status(500).json({
      message: 'Error fetching sale items',
      error: error.message
    });
  }
});

// Delete a sale
router.delete('/:id', protect, async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get the sale status and items
    const [sale] = await connection.query(
      'SELECT status FROM sales_invoices WHERE id = ?',
      [req.params.id]
    );

    if (!sale[0]) {
      throw new Error('Sale not found');
    }

    // Get the sale items
    const [items] = await connection.query(
      'SELECT product_id, quantity FROM sales_items WHERE invoice_id = ?',
      [req.params.id]
    );

    // If the sale was confirmed, restore inventory quantities
    if (sale[0].status === 'confirmed') {
      for (const item of items) {
        // Restore inventory quantities
        await connection.query(
          `UPDATE inventory
           SET quantity = quantity + ?
           WHERE id = ?`,
          [item.quantity, item.product_id]
        );

        // Record inventory transaction
        await connection.query(
          `INSERT INTO inventory_transactions
           (item_id, type, quantity, reference, notes)
           VALUES (?, ?, ?, ?, ?)`,
          [
            item.product_id,
            'IN',
            item.quantity,
            `${req.params.id}-DEL`,
            `Sale Deleted for invoice ${req.params.id}`
          ]
        );
      }
    }

    // Delete sale items
    await connection.query(
      'DELETE FROM sales_items WHERE invoice_id = ?',
      [req.params.id]
    );

    // Delete the sale invoice
    await connection.query(
      'DELETE FROM sales_invoices WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: 'Sale deleted successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Error deleting sale:', error);
    res.status(500).json({
      message: 'Error deleting sale',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Update the mark-paid route handler
router.put('/:id/mark-paid', protect, async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get sale details first
    const [sale] = await connection.execute(
      `SELECT si.*, u.name as created_by_name
       FROM sales_invoices si
       LEFT JOIN users u ON si.created_by = u.id
       WHERE si.id = ?`,
      [req.params.id]
    );

    if (!sale[0]) {
      throw new Error('Sale not found');
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'bank', 'check'];
    if (!validPaymentMethods.includes(sale[0].payment_method)) {
      throw new Error('Invalid payment method');
    }

    // Get the relevant account IDs first
    const [accounts] = await connection.execute(
      'SELECT id, code FROM accounts WHERE code IN (?, ?, ?)',
      ['1001', '1002', '4001']
    );

    const accountMap = accounts.reduce((acc, account) => {
      acc[account.code] = account.id;
      return acc;
    }, {});

    if (!accountMap['1001'] || !accountMap['1002'] || !accountMap['4001']) {
      throw new Error('Required accounts not found. Please check account configuration.');
    }

    // Update the sale payment status
    await connection.execute(
      'UPDATE sales_invoices SET payment_status = ?, payment_date = CURRENT_DATE() WHERE id = ?',
      ['paid', req.params.id]
    );

    // Create transaction record
    const [transactionResult] = await connection.execute(
      `INSERT INTO transactions
       (date, reference, description, type, category, amount, status, payment_method, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        new Date().toISOString().split('T')[0],
        sale[0].invoice_number,
        `Payment received for sale invoice ${sale[0].invoice_number}`,
        'revenue',
        'sales_income',
        sale[0].total,
        'posted',
        sale[0].payment_method,
        req.user.id
      ]
    );

    const transactionId = transactionResult.insertId;

    // Create transaction entries
    // Debit Cash/Bank Account
    await connection.execute(
      `INSERT INTO transactions_entries
       (transaction_id, account_id, description, debit, credit)
       VALUES (?, ?, ?, ?, ?)`,
      [
        transactionId,
        sale[0].payment_method === 'cash' ? accountMap['1001'] : accountMap['1002'],
        `Payment received for sale invoice ${sale[0].invoice_number}`,
        sale[0].total,
        0
      ]
    );

    // Credit Sales Revenue Account
    await connection.execute(
      `INSERT INTO transactions_entries
       (transaction_id, account_id, description, debit, credit)
       VALUES (?, ?, ?, ?, ?)`,
      [
        transactionId,
        accountMap['4001'],
        `Revenue from sale invoice ${sale[0].invoice_number}`,
        0,
        sale[0].total
      ]
    );

    // Update account balances
    await connection.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [sale[0].total, sale[0].payment_method === 'cash' ? accountMap['1001'] : accountMap['1002']]
    );

    await connection.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [sale[0].total, accountMap['4001']]
    );

    await connection.commit();
    res.json({
      message: 'Sale marked as paid and transaction recorded successfully',
      transactionId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error marking sale as paid:', error);
    res.status(500).json({
      message: 'Error marking sale as paid',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;