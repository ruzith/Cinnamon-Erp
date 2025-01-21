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
      const [itemsResult] = await connection.execute(
        `SELECT si.*, p.product_name, p.unit
         FROM sales_items si
         LEFT JOIN inventory p ON si.product_id = p.id
         WHERE si.invoice_id = ?`,
        [req.params.id]
      );

      sale.items = itemsResult;

      // Get company settings
      const [settingsResult] = await connection.execute(
        'SELECT * FROM settings WHERE id = 1'
      );
      const settings = settingsResult[0] || {};

      // Format dates and numbers
      const formattedDate = new Date(sale.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Generate invoice HTML
      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Sales Invoice - ${sale.invoice_number}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 15px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
              line-height: 1.5;
              font-size: 13px;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 90px;
              opacity: 0.05;
              z-index: -1;
              color: #000;
              white-space: nowrap;
            }
            .company-header {
              text-align: center;
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .company-name {
              font-size: 22px;
              font-weight: bold;
              margin: 0;
              color: #1976d2;
            }
            .company-details {
              font-size: 13px;
              color: #666;
              margin: 3px 0;
            }
            .document-title {
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin: 15px 0;
              color: #333;
              text-transform: uppercase;
            }
            .slip-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              padding: 12px;
              background-color: #f5f5f5;
              border-radius: 5px;
            }
            .customer-info, .invoice-info {
              flex: 1;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              font-size: 11px;
              text-transform: uppercase;
            }
            .info-value {
              font-size: 13px;
              margin-bottom: 6px;
            }
            .payment-details {
              margin: 12px 0;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 15px;
              border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              color: #333;
            }
            .amount {
              font-family: monospace;
              font-size: 13px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0;
              font-size: 12px;
            }
            .items-table th,
            .items-table td {
              padding: 8px 10px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            .items-table th {
              background-color: #f8f9fa;
              font-weight: bold;
              color: #666;
              font-size: 11px;
              text-transform: uppercase;
            }
            .items-table td.amount {
              text-align: right;
            }
            .total-section {
              margin-top: 12px;
              padding: 12px 15px;
              background-color: #1976d2;
              color: white;
              border-radius: 5px;
            }
            .footer {
              margin-top: 25px;
              padding-top: 12px;
              border-top: 1px solid #ddd;
              font-size: 11px;
              color: #666;
              text-align: center;
            }
            .company-registration {
              font-size: 11px;
              color: #666;
              margin: 3px 0;
            }
          </style>
        </head>
        <body>
          <div class="watermark">SALES INVOICE</div>

          <div class="company-header">
            <h1 class="company-name">${settings.company_name || 'COMPANY NAME'}</h1>
            <p class="company-details">${settings.company_address || ''}</p>
            <p class="company-details">Phone: ${settings.company_phone || ''}</p>
            <p class="company-registration">VAT No: ${settings.vat_number || ''} | Tax No: ${settings.tax_number || ''}</p>
          </div>

          <div class="document-title">Sales Invoice</div>

          <div class="slip-header">
            <div class="customer-info">
              <div class="info-label">Invoice To</div>
              <div class="info-value">${sale.customer_name}</div>
              <div class="info-value">${sale.customer_address || ''}</div>
              <div class="info-value">${sale.customer_phone || ''}</div>
              <div class="info-value">${sale.customer_email || ''}</div>
            </div>
            <div class="invoice-info">
              <div class="info-label">Invoice Number</div>
              <div class="info-value">${sale.invoice_number}</div>
              <div class="info-label">Date</div>
              <div class="info-value">${formattedDate}</div>
              <div class="info-label">Status</div>
              <div class="info-value">${sale.status.toUpperCase()}</div>
            </div>
          </div>

          <div class="payment-details">
            <div class="detail-row">
              <span class="detail-label">Payment Method</span>
              <span class="amount">${sale.payment_method.toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Status</span>
              <span class="amount">${sale.payment_status.toUpperCase()}</span>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit || ''}</td>
                  <td class="amount">Rs. ${Number(item.unit_price).toFixed(2)}</td>
                  <td class="amount">Rs. ${Number(item.sub_total).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display: flex; gap: 20px; margin-top: 20px;">
            <div style="flex: 1;">
              ${sale.notes ? `
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; height: 100%;">
                <div class="info-label">Notes</div>
                <div style="font-size: 13px; margin-top: 5px;">${sale.notes}</div>
              </div>
              ` : ''}
            </div>

            <div style="flex: 1;">
              <div class="payment-details">
                <div class="detail-row">
                  <span class="detail-label">Subtotal</span>
                  <span class="amount">Rs. ${Number(sale.sub_total).toFixed(2)}</span>
                </div>
                ${Number(sale.discount) > 0 ? `
                <div class="detail-row">
                  <span class="detail-label">Discount</span>
                  <span class="amount">-Rs. ${Number(sale.discount).toFixed(2)}</span>
                </div>
                ` : ''}
                ${Number(sale.tax) > 0 ? `
                <div class="detail-row">
                  <span class="detail-label">Tax</span>
                  <span class="amount">Rs. ${Number(sale.tax).toFixed(2)}</span>
                </div>
                ` : ''}
              </div>

              <div class="total-section detail-row">
                <span class="detail-label">Total Amount</span>
                <span class="amount">Rs. ${Number(sale.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} IST</p>
            <p>Thank you for your business!</p>
            <p>For any queries, please contact us at ${settings.company_phone || ''}</p>
          </div>
        </body>
        </html>
      `;

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

// Add this new route handler with your other routes
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