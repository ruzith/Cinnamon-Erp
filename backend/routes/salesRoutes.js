const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const SalesInvoice = require('../models/domain/SalesInvoice');
const Inventory = require('../models/domain/Inventory');
const { validateSalesInvoice } = require('../validators/salesValidator');
const PDFDocument = require('pdfkit');
const Customer = require('../models/domain/Customer');

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

// Update this route handler
router.get('/:id/print', protect, async (req, res) => {
  try {
    const sale = await SalesInvoice.getWithDetails(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Fetch settings
    const [settings] = await SalesInvoice.pool.execute(
      'SELECT company_name, company_address, company_phone FROM settings LIMIT 1'
    );
    const companySettings = settings[0] || {};

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${sale.invoice_number}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Helper function to draw a line
    const drawLine = (y) => {
      doc.moveTo(50, y).lineTo(550, y).stroke();
    };

    // Add company header using settings data
    doc.fontSize(24).text(companySettings.company_name || 'COMPANY NAME', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(companySettings.company_address || '', { align: 'center' });
    if (companySettings.company_phone) {
      doc.text(`Phone: ${companySettings.company_phone}`, { align: 'center' });
    }
    
    drawLine(doc.y + 10);
    doc.moveDown();

    // Add invoice details
    doc.fontSize(16).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Two-column layout for invoice details
    const leftColumn = 50;
    const rightColumn = 300;
    const startY = doc.y;

    // Left column - Invoice details
    doc.fontSize(10);
    doc.text('INVOICE TO:', leftColumn, startY);
    doc.fontSize(12);
    doc.text(sale.customer_name, leftColumn, startY + 20);
    doc.fontSize(10);
    doc.text(sale.customer_address || '', leftColumn, startY + 40);
    doc.text(sale.customer_phone || '', leftColumn, startY + 55);
    doc.text(sale.customer_email || '', leftColumn, startY + 70);

    // Right column - Invoice metadata
    doc.fontSize(10);
    doc.text('INVOICE DETAILS:', rightColumn, startY);
    doc.fontSize(12);
    doc.text(`Invoice Number: ${sale.invoice_number}`, rightColumn, startY + 20);
    doc.text(`Date: ${new Date(sale.date).toLocaleDateString()}`, rightColumn, startY + 40);
    doc.text(`Due Date: ${new Date(sale.due_date || sale.date).toLocaleDateString()}`, rightColumn, startY + 60);

    // Move to items table
    doc.moveDown(5);

    // Add items table header
    const tableTop = doc.y + 10;
    drawLine(tableTop - 5);
    doc.fontSize(10);
    doc.font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('Quantity', 250, tableTop);
    doc.text('Unit Price', 350, tableTop);
    doc.text('Total', 450, tableTop);
    drawLine(tableTop + 15);
    doc.font('Helvetica');

    // Add items
    let tableY = tableTop + 30;
    sale.items.forEach(item => {
      const unitPrice = parseFloat(item.unit_price || item.price || 0);
      const quantity = parseFloat(item.quantity || 0);
      const total = unitPrice * quantity;

      doc.text(item.product_name, 50, tableY);
      doc.text(quantity.toString(), 250, tableY);
      doc.text(unitPrice.toFixed(2), 350, tableY, { align: 'right', width: 70 });
      doc.text(total.toFixed(2), 450, tableY, { align: 'right', width: 70 });
      tableY += 20;
    });

    // Draw line after items
    drawLine(tableY + 5);

    // Add totals
    const subTotal = parseFloat(sale.sub_total || 0);
    const tax = parseFloat(sale.tax || 0);
    const total = parseFloat(sale.total || 0);
    const discount = parseFloat(sale.discount || 0);

    tableY += 20;
    doc.text('Subtotal:', 350, tableY);
    doc.text(subTotal.toFixed(2), 450, tableY, { align: 'right', width: 70 });
    
    if (discount > 0) {
      tableY += 20;
      doc.text('Discount:', 350, tableY);
      doc.text(`-${discount.toFixed(2)}`, 450, tableY, { align: 'right', width: 70 });
    }
    
    tableY += 20;
    doc.text('Tax:', 350, tableY);
    doc.text(tax.toFixed(2), 450, tableY, { align: 'right', width: 70 });
    
    tableY += 5;
    drawLine(tableY + 5);
    
    tableY += 20;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', 350, tableY);
    doc.text(total.toFixed(2), 450, tableY, { align: 'right', width: 70 });
    doc.font('Helvetica');

    // Add footer
    doc.fontSize(10);
    const bottomY = doc.page.height - 100;
    drawLine(bottomY);
    
    doc.text('Payment Terms:', 50, bottomY + 15);
    doc.text('Due within 30 days', 120, bottomY + 15);
    
    doc.text('Notes:', 50, bottomY + 35);
    doc.text(sale.notes || 'Thank you for your business!', 120, bottomY + 35);

    // Add page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8);
      doc.text(
        `Page ${i + 1} of ${pages.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 