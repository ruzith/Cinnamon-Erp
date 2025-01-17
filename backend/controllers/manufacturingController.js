const ManufacturingContractor = require('../models/domain/ManufacturingContractor');
const { validateContractor, validateAssignment, validateAdvancePayment } = require('../validators/manufacturingValidator');
const { pool } = require('../config/db');
const ManufacturingOrder = require('../models/domain/ManufacturingOrder');
const Inventory = require('../models/domain/Inventory');
const { generateAdvancePaymentReceipt, generateManufacturingReceipt } = require('../utils/receiptTemplates');
const Settings = require('../models/domain/Settings');
const AdvancePayment = require('../models/domain/AdvancePayment');

// @desc    Get all contractors
// @route   GET /api/manufacturing/contractors
// @access  Private
exports.getContractors = async (req, res) => {
  try {
    const contractors = await ManufacturingContractor.getActiveWithAssignments();
    res.status(200).json(contractors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single contractor
// @route   GET /api/manufacturing/contractors/:id
// @access  Private
exports.getContractor = async (req, res) => {
  try {
    const contractor = await ManufacturingContractor.findById(req.params.id);
    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }
    res.status(200).json(contractor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create contractor
// @route   POST /api/manufacturing/contractors
// @access  Private/Admin
exports.createContractor = async (req, res) => {
  try {
    const { error } = validateContractor(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingContractor = await ManufacturingContractor.findByContractorId(req.body.contractor_id);
    if (existingContractor) {
      return res.status(400).json({ message: 'Contractor ID already exists' });
    }

    const contractor = await ManufacturingContractor.create(req.body);
    res.status(201).json(contractor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update contractor
// @route   PUT /api/manufacturing/contractors/:id
// @access  Private/Admin
exports.updateContractor = async (req, res) => {
  try {
    const { error } = validateContractor(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const contractor = await ManufacturingContractor.findById(req.params.id);
    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    // Check for duplicate contractor ID if it's being changed
    if (req.body.contractor_id && req.body.contractor_id !== contractor.contractor_id) {
      const existingContractor = await ManufacturingContractor.findByContractorId(req.body.contractor_id);
      if (existingContractor) {
        return res.status(400).json({ message: 'Contractor ID already exists' });
      }
    }

    const updatedContractor = await ManufacturingContractor.update(req.params.id, req.body);
    res.status(200).json(updatedContractor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete contractor
// @route   DELETE /api/manufacturing/contractors/:id
// @access  Private/Admin
exports.deleteContractor = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { forceDelete, newContractorId } = req.query;
    await connection.beginTransaction();

    // Check if contractor exists
    const [contractor] = await connection.execute(
      'SELECT * FROM manufacturing_contractors WHERE id = ?',
      [req.params.id]
    );

    if (!contractor[0]) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Contractor not found' });
    }

    // Check for active assignments
    const [assignments] = await connection.execute(
      'SELECT * FROM cinnamon_assignments WHERE contractor_id = ? AND status = "active"',
      [req.params.id]
    );

    // Check for pending payments
    const [payments] = await connection.execute(
      'SELECT COUNT(*) as count FROM manufacturing_advance_payments WHERE contractor_id = ?',
      [req.params.id]
    );

    // If there are pending payments or active assignments and forceDelete is not true
    if ((payments[0].count > 0 || assignments.length > 0) && forceDelete !== 'true') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message: 'Cannot delete contractor with pending payments',
        pendingPayments: payments[0].count,
        assignmentCount: assignments.length
      });
    }

    if (assignments.length > 0) {
      if (forceDelete === 'true' && newContractorId) {
        // Verify new contractor exists and is active
        const [newContractor] = await connection.execute(
          'SELECT * FROM manufacturing_contractors WHERE id = ? AND status = "active"',
          [newContractorId]
        );

        if (!newContractor[0]) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ message: 'Invalid or inactive new contractor' });
        }

        // Update all assignments
        await connection.execute(
          'UPDATE cinnamon_assignments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, req.params.id]
        );

        // Update all payments if forceDelete is true
        await connection.execute(
          'UPDATE manufacturing_advance_payments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, req.params.id]
        );

        // Delete the contractor
        await connection.execute(
          'DELETE FROM manufacturing_contractors WHERE id = ?',
          [req.params.id]
        );

        await connection.commit();
        connection.release();

        return res.status(200).json({
          message: 'Contractor deleted successfully',
          reassignedAssignments: assignments
        });
      } else {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message: 'Cannot delete contractor with active assignments',
          activeAssignments: assignments,
          assignmentCount: assignments.length
        });
      }
    }

    // If no assignments, but there are payments and forceDelete is true
    if (payments[0].count > 0 && forceDelete === 'true' && newContractorId) {
      // Update all payments to new contractor
      await connection.execute(
        'UPDATE manufacturing_advance_payments SET contractor_id = ? WHERE contractor_id = ?',
        [newContractorId, req.params.id]
      );
    }

    await connection.execute(
      'DELETE FROM manufacturing_contractors WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    connection.release();

    return res.status(200).json({ message: 'Contractor deleted successfully' });
  } catch (error) {
    console.error('Error in deleteContractor:', error);
    await connection.rollback();
    connection.release();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all assignments
// @route   GET /api/manufacturing/assignments
// @access  Private
exports.getAssignments = async (req, res) => {
  try {
    const { contractor_name, start_date, end_date } = req.query;

    let query = `
      SELECT ca.*, mc.name as contractor_name, i.product_name as raw_material_name
      FROM cinnamon_assignments ca
      JOIN manufacturing_contractors mc ON ca.contractor_id = mc.id
      LEFT JOIN inventory i ON ca.raw_material_id = i.id
      WHERE 1=1
    `;

    const params = [];

    if (contractor_name) {
      query += ` AND mc.name LIKE ?`;
      params.push(`%${contractor_name}%`);
    }

    if (start_date) {
      query += ` AND ca.start_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND ca.end_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY ca.created_at DESC`;

    const [rows] = await pool.execute(query, params);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create assignment
// @route   POST /api/manufacturing/assignments
// @access  Private/Admin
exports.createAssignment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { contractor_id, quantity, duration, duration_type, start_date, notes, raw_material_id, raw_material_quantity } = req.body;

    await connection.beginTransaction();

    // Check if there's enough raw material in stock
    const [inventory] = await connection.execute(
      'SELECT * FROM inventory WHERE id = ? AND quantity >= ?',
      [raw_material_id, raw_material_quantity]
    );

    if (!inventory[0]) {
      throw new Error('Insufficient raw material stock');
    }

    // Calculate end date based on duration and duration_type
    const end_date = new Date(start_date);
    switch (duration_type) {
      case 'day':
        end_date.setDate(end_date.getDate() + parseInt(duration));
        break;
      case 'week':
        end_date.setDate(end_date.getDate() + (parseInt(duration) * 7));
        break;
      case 'month':
        end_date.setMonth(end_date.getMonth() + parseInt(duration));
        break;
    }

    // Create the assignment
    const [result] = await connection.execute(
      `INSERT INTO cinnamon_assignments
       (contractor_id, quantity, duration, duration_type, start_date, end_date, notes, status, raw_material_id, raw_material_quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [contractor_id, quantity, duration, duration_type, start_date, end_date, notes, raw_material_id, raw_material_quantity]
    );

    // Deduct raw material from inventory
    await connection.execute(
      'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
      [raw_material_quantity, raw_material_id]
    );

    // Record inventory transaction
    await connection.execute(
      'INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)',
      [
        raw_material_id,
        'OUT',
        raw_material_quantity,
        `CA-${result.insertId}`,
        'Allocated to contractor assignment'
      ]
    );

    // Get the created assignment with details
    const [assignment] = await connection.execute(
      `SELECT ca.*, mc.name as contractor_name, i.product_name as raw_material_name
       FROM cinnamon_assignments ca
       JOIN manufacturing_contractors mc ON ca.contractor_id = mc.id
       LEFT JOIN inventory i ON ca.raw_material_id = i.id
       WHERE ca.id = ?`,
      [result.insertId]
    );

    await connection.commit();
    res.status(201).json(assignment[0]);
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Update assignment
// @route   PUT /api/manufacturing/assignments/:id
// @access  Private/Admin
exports.updateAssignment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { quantity, duration, duration_type, start_date, notes, raw_material_id, raw_material_quantity } = req.body;

    await connection.beginTransaction();

    // Get the existing assignment
    const [existingAssignment] = await connection.execute(
      'SELECT * FROM cinnamon_assignments WHERE id = ?',
      [req.params.id]
    );

    if (!existingAssignment[0]) {
      throw new Error('Assignment not found');
    }

    // If raw material is being changed or quantity is increased
    if (raw_material_id !== existingAssignment[0].raw_material_id ||
        raw_material_quantity > existingAssignment[0].raw_material_quantity) {

      // Check stock for new material
      const [inventory] = await connection.execute(
        'SELECT * FROM inventory WHERE id = ?',
        [raw_material_id]
      );

      const additionalQuantity = raw_material_quantity - (existingAssignment[0].raw_material_quantity || 0);

      if (!inventory[0] || inventory[0].quantity < additionalQuantity) {
        throw new Error('Insufficient raw material stock');
      }

      // If material is being changed, return old material to stock
      if (raw_material_id !== existingAssignment[0].raw_material_id && existingAssignment[0].raw_material_id) {
        await connection.execute(
          'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
          [existingAssignment[0].raw_material_quantity, existingAssignment[0].raw_material_id]
        );

        // Record return transaction
        await connection.execute(
          'INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)',
          [
            existingAssignment[0].raw_material_id,
            'IN',
            existingAssignment[0].raw_material_quantity,
            `CA-${req.params.id}`,
            'Returned from updated assignment'
          ]
        );
      }

      // Deduct new material from stock
      await connection.execute(
        'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
        [additionalQuantity, raw_material_id]
      );

      // Record allocation transaction
      if (additionalQuantity > 0) {
        await connection.execute(
          'INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)',
          [
            raw_material_id,
            'OUT',
            additionalQuantity,
            `CA-${req.params.id}`,
            'Additional allocation to updated assignment'
          ]
        );
      }
    }

    // Update the assignment
    await connection.execute(
      `UPDATE cinnamon_assignments
       SET quantity = ?, duration = ?, duration_type = ?,
           start_date = ?, notes = ?, raw_material_id = ?,
           raw_material_quantity = ?
       WHERE id = ?`,
      [quantity, duration, duration_type, start_date, notes, raw_material_id, raw_material_quantity, req.params.id]
    );

    // Get the updated assignment with details
    const [updatedAssignment] = await connection.execute(
      `SELECT ca.*, mc.name as contractor_name, i.product_name as raw_material_name
       FROM cinnamon_assignments ca
       JOIN manufacturing_contractors mc ON ca.contractor_id = mc.id
       LEFT JOIN inventory i ON ca.raw_material_id = i.id
       WHERE ca.id = ?`,
      [req.params.id]
    );

    await connection.commit();
    res.status(200).json(updatedAssignment[0]);
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Get advance payments
// @route   GET /api/manufacturing/advance-payments
// @access  Private
exports.getAdvancePayments = async (req, res) => {
  try {
    const { contractorId } = req.params;
    const { status } = req.query;

    let payments;
    if (status === 'unused') {
      payments = await AdvancePayment.getUnusedPaymentsByContractor(contractorId);
    } else {
      payments = await AdvancePayment.findBy({ contractor_id: contractorId });
    }

    res.json(payments);
  } catch (error) {
    console.error('Error fetching advance payments:', error);
    res.status(500).json({ message: 'Error fetching advance payments' });
  }
};

// @desc    Create advance payment
// @route   POST /api/manufacturing/advance-payments
// @access  Private/Admin
exports.createAdvancePayment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Validate the request body
    const { error } = validateAdvancePayment(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { contractor_id, amount, payment_date, notes } = req.body;

    await connection.beginTransaction();

    // Check if contractor exists and is active
    const [contractors] = await connection.execute(
      'SELECT * FROM manufacturing_contractors WHERE id = ? AND status = "active"',
      [contractor_id]
    );

    if (!contractors[0]) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid or inactive contractor' });
    }

    const contractor = contractors[0];

    // Generate receipt number
    const date = new Date(payment_date);
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM manufacturing_advance_payments'
    );
    const count = countResult[0].count + 1;
    const receipt_number = `ADV${year}${month}${count.toString().padStart(4, '0')}`;

    // Insert the payment record
    const [result] = await connection.execute(
      `INSERT INTO manufacturing_advance_payments
       (contractor_id, amount, payment_date, receipt_number, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [contractor_id, amount, payment_date, receipt_number, notes]
    );

    // Get company settings
    const [settings] = await connection.execute(
      'SELECT * FROM settings WHERE id = 1'
    );
    const companyInfo = settings[0] || {};

    // Generate receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Advance Payment Receipt - ${receipt_number}</title>
        <style>
          @media print {
            @page { margin: 15mm; }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            opacity: 0.03;
            z-index: -1;
            color: #000;
            white-space: nowrap;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1976d2;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1976d2;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .company-details {
            font-size: 14px;
            color: #666;
            margin: 5px 0;
          }
          .document-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .info-section {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin-bottom: 40px;
            padding: 25px;
            background-color: #f8f9fa;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .info-group {
            display: grid;
            gap: 20px;
          }
          .info-item {
            margin-bottom: 15px;
          }
          .info-label {
            font-weight: 600;
            color: #666;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 15px;
            color: #333;
          }
          .amount-section {
            margin: 30px 0;
            padding: 20px;
            background-color: #1976d2;
            color: white;
            border-radius: 8px;
            text-align: right;
          }
          .amount-label {
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .amount-value {
            font-size: 24px;
            font-weight: bold;
            margin-top: 5px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .receipt-number {
            font-family: monospace;
            font-size: 16px;
            color: #1976d2;
            font-weight: bold;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="watermark">ADVANCE PAYMENT</div>

        <div class="header">
          <h1 class="company-name">${companyInfo.company_name || 'Company Name'}</h1>
          <div class="company-details">${companyInfo.company_address || 'Company Address'}</div>
          <div class="company-details">Tel: ${companyInfo.company_phone || 'N/A'}</div>
        </div>

        <div class="document-title">Advance Payment Receipt</div>

        <div class="info-section">
          <div class="info-group">
            <div class="info-item">
              <div class="info-label">Receipt Number</div>
              <div class="info-value receipt-number">${receipt_number}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date</div>
              <div class="info-value">${new Date(payment_date).toLocaleDateString()}</div>
            </div>
          </div>
          <div class="info-group">
            <div class="info-item">
              <div class="info-label">Contractor Details</div>
              <div class="info-value">${contractor.name}</div>
              <div class="info-value" style="color: #666; font-size: 13px;">ID: ${contractor.contractor_id}</div>
              <div class="info-value" style="color: #666; font-size: 13px;">Tel: ${contractor.phone || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="amount-section">
          <div class="amount-label">Advance Payment Amount</div>
          <div class="amount-value">Rs. ${parseFloat(amount).toFixed(2)}</div>
        </div>

        ${notes ? `
        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <div class="info-label">Notes</div>
          <div style="margin-top: 5px;">${notes}</div>
        </div>
        ` : ''}

        <div class="footer">
          <p>This is a computer generated receipt</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    await connection.commit();

    res.json({
      message: 'Advance payment created successfully',
      receiptHtml,
      payment: {
        id: result.insertId,
        contractor_name: contractor.name,
        amount,
        payment_date,
        receipt_number,
        notes
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating advance payment:', error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

exports.startProduction = async (req, res) => {
  try {
    const { orderId, materials } = req.body;
    await ManufacturingOrder.startProduction(orderId, materials);
    res.status(200).json({ message: 'Production started successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.completeProduction = async (req, res) => {
  try {
    const { orderId, productData } = req.body;
    await ManufacturingOrder.completeProduction(orderId, productData);
    res.status(200).json({ message: 'Production completed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMaterialRequirements = async (req, res) => {
  try {
    const { orderId } = req.params;
    const materials = await ManufacturingOrder.getMaterialRequirements(orderId);
    res.status(200).json(materials);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.generateOrderReceipt = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    // Get order details with product info
    const [orders] = await connection.execute(`
      SELECT
        mo.*,
        p.name as product_name,
        p.code as product_code,
        p.unit_price,
        (mo.quantity * p.unit_price) as calculated_amount,
        u.name as created_by_name
      FROM manufacturing_orders mo
      JOIN products p ON mo.product_id = p.id
      LEFT JOIN users u ON mo.created_by = u.id
      WHERE mo.id = ?
    `, [id]);

    if (!orders[0]) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Get company settings
    const [settings] = await connection.execute(
      'SELECT * FROM settings WHERE id = 1'
    );
    const companyInfo = settings[0] || {};

    // Calculate total amount
    const totalAmount = parseFloat(order.calculated_amount || 0).toFixed(2);

    // Generate receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Manufacturing Order Receipt - ${order.order_number}</title>
        <style>
          @media print {
            @page { margin: 15mm; }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            opacity: 0.03;
            z-index: -1;
            color: #000;
            white-space: nowrap;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1976d2;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1976d2;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .company-details {
            font-size: 14px;
            color: #666;
            margin: 5px 0;
          }
          .document-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .info-section {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin-bottom: 40px;
            padding: 25px;
            background-color: #f8f9fa;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .info-group {
            display: grid;
            gap: 20px;
          }
          .info-item {
            margin-bottom: 15px;
          }
          .info-label {
            font-weight: 600;
            color: #666;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 15px;
            color: #333;
          }
          .amount-section {
            margin: 30px 0;
            padding: 20px;
            background-color: #1976d2;
            color: white;
            border-radius: 8px;
            text-align: right;
          }
          .amount-label {
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .amount-value {
            font-size: 24px;
            font-weight: bold;
            margin-top: 5px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .receipt-number {
            font-family: monospace;
            font-size: 16px;
            color: #1976d2;
            font-weight: bold;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="watermark">MANUFACTURING RECEIPT</div>

        <div class="header">
          <h1 class="company-name">${companyInfo.company_name || 'Company Name'}</h1>
          <div class="company-details">${companyInfo.company_address || 'Company Address'}</div>
          <div class="company-details">Tel: ${companyInfo.company_phone || 'N/A'}</div>
        </div>

        <div class="document-title">Manufacturing Order Receipt</div>

        <div class="info-section">
          <div class="info-group">
            <div class="info-item">
              <div class="info-label">Order Number</div>
              <div class="info-value receipt-number">${order.order_number}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Product Details</div>
              <div class="info-value product-info">
                ${order.product_name}
                <span class="product-code">${order.product_code ? `(${order.product_code})` : ''}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Quantity</div>
              <div class="info-value">${order.quantity} units</div>
            </div>
          </div>

          <div class="info-group">
            <div class="info-item">
              <div class="info-label">Status</div>
              <div class="info-value">${order.status}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Start Date</div>
              <div class="info-value">${new Date(order.start_date).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">End Date</div>
              <div class="info-value">${order.end_date ? new Date(order.end_date).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="amount-section">
          <div class="amount-label">Total Amount</div>
          <div class="amount-value">Rs. ${totalAmount}</div>
        </div>

        <div class="footer">
          <p>Created by: ${order.created_by_name || 'System'} | Generated on: ${new Date().toLocaleString()}</p>
          <p>This is a computer generated receipt</p>
        </div>
      </body>
      </html>
    `;

    res.json({ receiptHtml });
  } catch (error) {
    console.error('Error generating order receipt:', error);
    res.status(500).json({
      message: 'Error generating receipt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

exports.markOrderAsPaid = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if order exists and is completed
    const [orders] = await connection.execute(
      `SELECT mo.*, p.name as product_name, p.id as product_id
       FROM manufacturing_orders mo
       JOIN products p ON mo.product_id = p.id
       WHERE mo.id = ?`,
      [id]
    );

    if (!orders[0]) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    if (order.status !== 'completed') {
      await connection.rollback();
      return res.status(400).json({ message: 'Only completed orders can be marked as paid' });
    }

    if (order.payment_status === 'paid') {
      await connection.rollback();
      return res.status(400).json({ message: 'Order is already marked as paid' });
    }

    // Update payment status
    await connection.execute(
      `UPDATE manufacturing_orders
       SET payment_status = 'paid',
           payment_date = CURRENT_TIMESTAMP(),
           updated_at = CURRENT_TIMESTAMP()
       WHERE id = ?`,
      [id]
    );

    // Add to finished goods inventory if not already added
    if (!order.inventory_updated) {
      // First get the inventory item ID for this product
      const [inventoryItems] = await connection.execute(
        `SELECT i.id, i.product_name, i.quantity
         FROM inventory i
         JOIN products p ON p.name = i.product_name
         WHERE i.category = 'finished_good'
         AND p.id = ?`,
        [order.product_id]
      );

      if (!inventoryItems[0]) {
        // If no inventory item exists, create one
        const [result] = await connection.execute(
          `INSERT INTO inventory
           (product_name, category, quantity, unit, min_stock_level, max_stock_level,
            purchase_price, selling_price, status)
           SELECT
             name as product_name,
             'finished_good' as category,
             0 as quantity,
             'kg' as unit,
             100 as min_stock_level,
             1000 as max_stock_level,
             0 as purchase_price,
             unit_price as selling_price,
             'active' as status
           FROM products
           WHERE id = ?`,
          [order.product_id]
        );

        const inventoryItemId = result.insertId;

        // Create inventory transaction
        await connection.execute(
          `INSERT INTO inventory_transactions
           (item_id, type, quantity, reference, notes)
           VALUES (?, ?, ?, ?, ?)`,
          [
            inventoryItemId,
            'IN',
            order.quantity,
            `MO-${order.order_number}`,
            `Production completed from manufacturing order ${order.order_number}`
          ]
        );

        // Update inventory quantity
        await connection.execute(
          `UPDATE inventory
           SET quantity = quantity + ?,
               updated_at = CURRENT_TIMESTAMP()
           WHERE id = ?`,
          [order.quantity, inventoryItemId]
        );
      } else {
        // Use existing inventory item
        const inventoryItemId = inventoryItems[0].id;

        // Create inventory transaction
        await connection.execute(
          `INSERT INTO inventory_transactions
           (item_id, type, quantity, reference, notes)
           VALUES (?, ?, ?, ?, ?)`,
          [
            inventoryItemId,
            'IN',
            order.quantity,
            `MO-${order.order_number}`,
            `Production completed from manufacturing order ${order.order_number}`
          ]
        );

        // Update inventory quantity
        await connection.execute(
          `UPDATE inventory
           SET quantity = quantity + ?,
               updated_at = CURRENT_TIMESTAMP()
           WHERE id = ?`,
          [order.quantity, inventoryItemId]
        );
      }

      // Mark inventory as updated
      await connection.execute(
        `UPDATE manufacturing_orders
         SET inventory_updated = TRUE,
             updated_at = CURRENT_TIMESTAMP()
         WHERE id = ?`,
        [id]
      );
    }

    await connection.commit();
    res.json({
      message: 'Order marked as paid successfully',
      order: {
        ...order,
        payment_status: 'paid',
        payment_date: new Date(),
        inventory_updated: true
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error marking order as paid:', error);
    res.status(500).json({
      message: 'Error marking order as paid',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

exports.printInvoice = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    // Get invoice details with items
    const [invoices] = await connection.execute(`
      SELECT
        pi.*,
        cc.name as contractor_name,
        cc.phone as contractor_phone,
        cc.address as contractor_address
      FROM purchase_invoices pi
      JOIN cutting_contractors cc ON pi.contractor_id = cc.id
      WHERE pi.id = ?
    `, [id]);

    if (!invoices[0]) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = invoices[0];

    // Get invoice items with their details
    const [items] = await connection.execute(`
      SELECT
        pit.*,
        i.product_name,
        i.unit,
        CAST(pit.total_weight AS DECIMAL(15,2)) as total_weight,
        CAST(pit.deduct_weight1 AS DECIMAL(15,2)) as deduct_weight1,
        CAST(pit.deduct_weight2 AS DECIMAL(15,2)) as deduct_weight2,
        CAST(pit.net_weight AS DECIMAL(15,2)) as net_weight,
        CAST(pit.rate AS DECIMAL(15,2)) as rate,
        CAST(pit.amount AS DECIMAL(15,2)) as amount
      FROM purchase_items pit
      JOIN inventory i ON pit.grade_id = i.id
      WHERE pit.invoice_id = ?
    `, [id]);

    // Get company settings
    const [settingsResult] = await connection.execute(
      'SELECT * FROM settings WHERE id = 1'
    );
    const settings = settingsResult[0] || {};

    // Format dates and ensure numbers
    invoice.invoice_date = invoice.invoice_date ? new Date(invoice.invoice_date) : new Date();
    invoice.due_date = invoice.due_date ? new Date(invoice.due_date) : new Date();
    invoice.items = items;
    invoice.total_amount = Number(invoice.total_amount) || 0;
    invoice.cutting_rate = Number(invoice.cutting_rate) || 0;
    invoice.cutting_charges = Number(invoice.cutting_charges) || 0;
    invoice.advance_payment = Number(invoice.advance_payment) || 0;
    invoice.final_amount = Number(invoice.final_amount) || 0;

    // Process items to ensure numbers
    invoice.items = items.map(item => ({
      ...item,
      total_weight: Number(item.total_weight) || 0,
      deduct_weight1: Number(item.deduct_weight1) || 0,
      deduct_weight2: Number(item.deduct_weight2) || 0,
      net_weight: Number(item.net_weight) || 0,
      rate: Number(item.rate) || 0,
      amount: Number(item.amount) || 0
    }));

    // Calculate totals
    const totals = items.reduce((acc, item) => ({
      total_weight: acc.total_weight + item.total_weight,
      deduct_weight1: acc.deduct_weight1 + item.deduct_weight1,
      deduct_weight2: acc.deduct_weight2 + item.deduct_weight2,
      net_weight: acc.net_weight + item.net_weight,
      amount: acc.amount + item.amount
    }), {
      total_weight: 0,
      deduct_weight1: 0,
      deduct_weight2: 0,
      net_weight: 0,
      amount: 0
    });

    invoice.totals = totals;

    // Generate receipt HTML using the template
    const invoiceHtml = generatePurchaseInvoice(invoice, settings);

    res.json({ invoiceHtml });
  } catch (error) {
    console.error('Error printing invoice:', error);
    res.status(500).json({
      message: 'Error printing invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// Update the generatePurchaseInvoice helper function
const generatePurchaseInvoice = (invoice, settings) => {
  // Ensure totals are numbers before using toFixed
  const totals = {
    total_weight: Number(invoice.totals.total_weight || 0),
    deduct_weight1: Number(invoice.totals.deduct_weight1 || 0),
    deduct_weight2: Number(invoice.totals.deduct_weight2 || 0),
    net_weight: Number(invoice.totals.net_weight || 0),
    amount: Number(invoice.totals.amount || 0)
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Purchase Invoice - ${invoice.invoice_number}</title>
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
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          opacity: 0.05;
          z-index: -1;
          color: #000;
          white-space: nowrap;
        }
        .company-header {
          text-align: center;
          margin-bottom: 18px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
          color: #1976d2;
        }
        .company-details {
          font-size: 13px;
          color: #666;
          margin: 4px 0;
        }
        .document-title {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin: 18px 0;
          color: #333;
          text-transform: uppercase;
        }
        .slip-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 18px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        .order-info, .contractor-info {
          flex: 1;
        }
        .info-label {
          font-weight: bold;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
        }
        .info-value {
          font-size: 13px;
          margin-bottom: 8px;
        }
        .materials-details {
          margin: 18px 0;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .materials-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
        }
        .materials-table th {
          background-color: #f8f9fa;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .materials-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }
        .total-section {
          margin-top: 18px;
          padding: 15px;
          background-color: #1976d2;
          color: white;
          border-radius: 5px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 6px 0;
          font-size: 13px;
        }
        .total-label {
          font-weight: bold;
        }
        .final-row {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 15px;
        }
        .footer {
          margin-top: 18px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="watermark">PURCHASE INVOICE</div>

      <div class="company-header">
        <h1 class="company-name">${settings.company_name || 'Company Name'}</h1>
        <p class="company-details">${settings.company_address || 'Company Address'}</p>
        <p class="company-details">Tel: ${settings.company_phone || 'N/A'}</p>
      </div>

      <div class="document-title">Purchase Invoice</div>

      <div class="slip-header">
        <div class="order-info">
          <div class="info-label">Invoice Number</div>
          <div class="info-value">${invoice.invoice_number}</div>
          <div class="info-label">Date</div>
          <div class="info-value">${new Date(invoice.invoice_date).toLocaleDateString()}</div>
          <div class="info-label">Due Date</div>
          <div class="info-value">${new Date(invoice.due_date).toLocaleDateString()}</div>
        </div>
        <div class="contractor-info">
          <div class="info-label">Contractor Details</div>
          <div class="info-value">${invoice.contractor_name || 'N/A'}</div>
          <div class="info-value">Code: ${invoice.contractor_code || 'N/A'}</div>
        </div>
      </div>

      <div class="materials-details">
        <table class="materials-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Total Weight</th>
              <th>Deduct 1</th>
              <th>Deduct 2</th>
              <th>Net Weight</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.total_weight.toFixed(2)} ${item.unit}</td>
                <td>${item.deduct_weight1.toFixed(2)} ${item.unit}</td>
                <td>${item.deduct_weight2.toFixed(2)} ${item.unit}</td>
                <td>${item.net_weight.toFixed(2)} ${item.unit}</td>
                <td>Rs. ${item.rate.toFixed(2)}</td>
                <td>Rs. ${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="total-section">
        <div class="total-row">
          <span class="total-label">Total Amount</span>
          <span>Rs. ${invoice.total_amount.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Cutting Rate</span>
          <span>Rs. ${invoice.cutting_rate.toFixed(2)}/kg</span>
        </div>
        <div class="total-row">
          <span class="total-label">Cutting Charges</span>
          <span>Rs. ${invoice.cutting_charges.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Advance Payment</span>
          <span>Rs. ${invoice.advance_payment.toFixed(2)}</span>
        </div>
        <div class="total-row final-row">
          <span class="total-label">Final Amount</span>
          <span>Rs. ${invoice.final_amount.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Notes: ${invoice.notes || 'N/A'}</p>
        <p>For any queries, please contact us at ${settings.company_phone || 'N/A'} | Generated on ${new Date().toLocaleString()} IST</p>
      </div>
    </body>
    </html>
  `;
};

// @desc    Get cinnamon assignment reports
// @route   GET /api/manufacturing/reports/assignments
// @access  Private
exports.getAssignmentReports = async (req, res) => {
  try {
    const { contractor_name, start_date, end_date } = req.query;

    let query = `
      SELECT
        ca.*,
        mc.name as contractor_name,
        mc.contractor_id,
        mc.phone as contractor_phone,
        i.product_name as raw_material_name,
        'kg' as raw_material_unit
      FROM cinnamon_assignments ca
      JOIN manufacturing_contractors mc ON ca.contractor_id = mc.id
      LEFT JOIN inventory i ON ca.raw_material_id = i.id
      WHERE 1=1
    `;

    const params = [];

    if (contractor_name) {
      query += ` AND mc.name LIKE ?`;
      params.push(`%${contractor_name}%`);
    }

    if (start_date) {
      query += ` AND ca.start_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND ca.end_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY ca.created_at DESC`;

    const [rows] = await pool.execute(query, params);

    // Calculate statistics for each assignment
    const assignmentReports = rows.map(assignment => {
      // Calculate efficiency based on assignment status
      let efficiency = '0.00';
      if (assignment.status === 'completed') {
        efficiency = assignment.raw_material_quantity > 0
          ? ((assignment.quantity / assignment.raw_material_quantity) * 100).toFixed(2)
          : '0.00';
      } else if (assignment.status === 'active') {
        // For active assignments, show target/expected efficiency
        efficiency = assignment.raw_material_quantity > 0
          ? ((assignment.quantity / assignment.raw_material_quantity) * 100).toFixed(2) + '*'  // Add asterisk to indicate target
          : '0.00';
      } else if (assignment.status === 'cancelled') {
        efficiency = 'N/A';  // Not applicable for cancelled assignments
      }

      // Create summary for single assignment
      const summary = {
        rawMaterial: assignment.raw_material_quantity,
        finishedProduct: assignment.quantity,
        status: assignment.status,
        efficiency: efficiency,
        startDate: assignment.start_date,
        endDate: assignment.end_date,
        duration: `${assignment.duration} ${assignment.duration_type}(s)`,
        notes: assignment.notes || 'N/A'
      };

      // Add progress indicators for active assignments
      if (assignment.status === 'active') {
        const startDate = new Date(assignment.start_date);
        const endDate = new Date(assignment.end_date);
        const currentDate = new Date();

        // Calculate time progress
        const totalDuration = endDate - startDate;
        const elapsed = currentDate - startDate;
        const timeProgress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

        summary.timeProgress = timeProgress.toFixed(1) + '%';
        summary.remainingDays = Math.max(Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)), 0);
      }

      return {
        ...assignment,
        efficiency,
        summary
      };
    });

    res.status(200).json(assignmentReports);
  } catch (error) {
    console.error('Error generating assignment reports:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Print assignment report
// @route   GET /api/manufacturing/assignments/:id/report
// @access  Private
exports.printAssignmentReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Get assignment details with joins
    const [rows] = await pool.execute(`
      SELECT
        ca.*,
        mc.name as contractor_name,
        mc.contractor_id,
        mc.phone as contractor_phone,
        i.product_name as raw_material_name,
        'kg' as raw_material_unit
      FROM cinnamon_assignments ca
      JOIN manufacturing_contractors mc ON ca.contractor_id = mc.id
      LEFT JOIN inventory i ON ca.raw_material_id = i.id
      WHERE ca.id = ?
    `, [id]);

    const assignment = rows[0];
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Calculate efficiency
    let efficiency = '0.00';
    if (assignment.status === 'completed') {
      efficiency = assignment.raw_material_quantity > 0
        ? ((assignment.quantity / assignment.raw_material_quantity) * 100).toFixed(2)
        : '0.00';
    } else if (assignment.status === 'active') {
      efficiency = assignment.raw_material_quantity > 0
        ? ((assignment.quantity / assignment.raw_material_quantity) * 100).toFixed(2) + '*'
        : '0.00';
    } else if (assignment.status === 'cancelled') {
      efficiency = 'N/A';
    }

    // Get company settings
    const settings = await Settings.get();

    // Generate report HTML
    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Assignment Report - ${assignment.contractor_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; }
            .report-title { font-size: 20px; margin: 20px 0; }
            .section { margin: 20px 0; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .info-item { margin: 10px 0; }
            .label { font-weight: bold; }
            .status { padding: 5px 10px; border-radius: 4px; display: inline-block; }
            .status-completed { background: #e8f5e9; color: #2e7d32; }
            .status-active { background: #e3f2fd; color: #1976d2; }
            .status-cancelled { background: #f5f5f5; color: #757575; }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${settings.company_name}</div>
            <div>${settings.address}</div>
            <div>Tel: ${settings.phone}</div>
          </div>

          <div class="report-title">
            Assignment Report - ${assignment.contractor_name}
          </div>

          <div class="section">
            <div class="section-title">Contract Information</div>
            <div class="grid">
              <div class="info-item">
                <span class="label">Contractor ID:</span>
                <span>${assignment.contractor_id}</span>
              </div>
              <div class="info-item">
                <span class="label">Phone:</span>
                <span>${assignment.contractor_phone}</span>
              </div>
              <div class="info-item">
                <span class="label">Start Date:</span>
                <span>${new Date(assignment.start_date).toLocaleDateString()}</span>
              </div>
              <div class="info-item">
                <span class="label">End Date:</span>
                <span>${new Date(assignment.end_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Production Details</div>
            <div class="grid">
              <div class="info-item">
                <span class="label">Raw Material:</span>
                <span>${assignment.raw_material_name}</span>
              </div>
              <div class="info-item">
                <span class="label">Raw Material Quantity:</span>
                <span>${assignment.raw_material_quantity} kg</span>
              </div>
              <div class="info-item">
                <span class="label">Expected Output:</span>
                <span>${assignment.quantity} kg</span>
              </div>
              <div class="info-item">
                <span class="label">Efficiency:</span>
                <span>${efficiency}${assignment.status === 'active' ? ' (Target)' : ''}</span>
              </div>
              <div class="info-item">
                <span class="label">Duration:</span>
                <span>${assignment.duration} ${assignment.duration_type}(s)</span>
              </div>
              <div class="info-item">
                <span class="label">Status:</span>
                <span class="status status-${assignment.status}">
                  ${assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          ${assignment.notes ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <div>${assignment.notes}</div>
          </div>
          ` : ''}

          ${assignment.status === 'active' ? `
          <div class="section">
            <div class="section-title">Progress Tracking</div>
            <div class="grid">
              <div class="info-item">
                <span class="label">Time Progress:</span>
                <span>${calculateTimeProgress(assignment.start_date, assignment.end_date)}%</span>
              </div>
              <div class="info-item">
                <span class="label">Remaining Days:</span>
                <span>${calculateRemainingDays(assignment.end_date)} days</span>
              </div>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p>Created by: ${assignment.created_by_name || 'System'} | Generated on: ${new Date().toLocaleString()}</p>
            <p>This is a computer generated receipt</p>
          </div>
        </body>
      </html>
    `;

    res.json({ reportHtml });
  } catch (error) {
    console.error('Error printing assignment report:', error);
    res.status(500).json({ message: 'Error printing report' });
  }
};

// Helper function to calculate time progress
function calculateTimeProgress(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date();
  const totalDuration = end - start;
  const elapsed = current - start;
  const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  return progress.toFixed(1);
}

// Helper function to calculate remaining days
function calculateRemainingDays(endDate) {
  const end = new Date(endDate);
  const current = new Date();
  return Math.max(Math.ceil((end - current) / (1000 * 60 * 60 * 24)), 0);
}

// @desc    Get advance payments for a specific contractor
// @route   GET /api/manufacturing/contractors/:id/advance-payments
// @access  Private
exports.getContractorAdvancePayments = async (req, res) => {
  try {
    const { status } = req.query;
    let payments;

    if (status === 'unused') {
      payments = await AdvancePayment.getUnusedPaymentsByContractor(req.params.id);
    } else {
      const [rows] = await pool.execute(`
        SELECT ap.*, mc.name as contractor_name
        FROM manufacturing_advance_payments ap
        JOIN manufacturing_contractors mc ON ap.contractor_id = mc.id
        WHERE ap.contractor_id = ?
        ORDER BY ap.payment_date DESC
      `, [req.params.id]);
      payments = rows;
    }

    // Calculate total unused advance amount
    const totalUnusedAdvance = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

    res.status(200).json({
      payments,
      totalUnusedAdvance: parseFloat(totalUnusedAdvance.toFixed(2))
    });
  } catch (error) {
    console.error('Error fetching advance payments:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create purchase invoice
// @route   POST /api/manufacturing/purchase-invoices
// @access  Private/Admin
exports.createPurchaseInvoice = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      contractor,
      items,
      status,
      notes,
      selectedAdvanceIds,
      totalAmount,
      totalNetWeight,
      cuttingRate,
      cuttingCharges,
      advancePayment,
      finalAmount
    } = req.body;

    // Validate required fields
    if (!contractor) {
      throw new Error('Contractor is required');
    }
    if (!items || items.length === 0) {
      throw new Error('At least one item is required');
    }

    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const [lastInvoice] = await connection.query(
      'SELECT invoice_number FROM purchase_invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1',
      [`PUR${year}${month}%`]
    );

    let invoiceNumber;
    if (lastInvoice.length > 0) {
      const lastNumber = parseInt(lastInvoice[0].invoice_number.slice(-4));
      invoiceNumber = `PUR${year}${month}${(lastNumber + 1).toString().padStart(4, '0')}`;
    } else {
      invoiceNumber = `PUR${year}${month}0001`;
    }

    // Insert purchase invoice
    const [result] = await connection.execute(
      `INSERT INTO purchase_invoices (
        invoice_number,
        contractor_id,
        invoice_date,
        due_date,
        subtotal,
        total_amount,
        cutting_rate,
        cutting_charges,
        advance_payment,
        final_amount,
        status,
        notes,
        created_by
      ) VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        contractor, // Keep contractor_id
        totalAmount,
        totalAmount,
        cuttingRate,
        cuttingCharges,
        advancePayment,
        finalAmount,
        status,
        notes || '',
        req.user.id
      ]
    );

    const invoiceId = result.insertId;

    // Insert purchase items
    for (const item of items) {
      await connection.execute(
        `INSERT INTO purchase_items (
          invoice_id,
          grade_id,
          total_weight,
          deduct_weight1,
          deduct_weight2,
          net_weight,
          rate,
          amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.grade,
          item.total_weight,
          item.deduct_weight1,
          item.deduct_weight2,
          item.net_weight,
          item.rate,
          item.amount
        ]
      );
    }

    // Update advance payment status if any
    if (selectedAdvanceIds && selectedAdvanceIds.length > 0) {
      // Update cutting advance payments status to used
      await connection.execute(
        `UPDATE cutting_advance_payments
         SET
           status = 'used',
           used_in_invoice = ?,
           used_date = CURRENT_TIMESTAMP
         WHERE id IN (${selectedAdvanceIds.map(() => '?').join(',')})`,
        [invoiceId, ...selectedAdvanceIds]
      );

      // Create a record in cutting_payment_usages table
      for (const advanceId of selectedAdvanceIds) {
        const [advancePayment] = await connection.execute(
          'SELECT amount FROM cutting_advance_payments WHERE id = ?',
          [advanceId]
        );

        if (advancePayment.length > 0) {
          await connection.execute(
            `INSERT INTO cutting_payment_usages (
              advance_payment_id,
              invoice_id,
              used_date,
              amount,
              notes
            ) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)`,
            [
              advanceId,
              invoiceId,
              advancePayment[0].amount,
              `Used in purchase invoice ${invoiceNumber}`
            ]
          );
        }
      }
    }

    await connection.commit();
    res.status(201).json({
      message: 'Purchase invoice created successfully',
      id: invoiceId,
      invoice_number: invoiceNumber
    });
  } catch (error) {
    await connection.rollback();
    console.error('Detailed error creating purchase invoice:', error);
    res.status(400).json({
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    connection.release();
  }
};

// @desc    Get manufacturing invoices
// @route   GET /api/manufacturing/invoices
// @access  Private
exports.getManufacturingInvoices = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [invoices] = await connection.query(`
      SELECT
        pi.id,
        pi.invoice_number,
        pi.invoice_date,
        pi.due_date,
        pi.subtotal,
        pi.cutting_charges,
        pi.advance_payment,
        pi.final_amount,
        pi.total_amount,
        pi.status,
        pi.notes,
        pi.created_at,
        cc.name as contractor_name,
        u.name as created_by_name
      FROM purchase_invoices pi
      LEFT JOIN cutting_contractors cc ON pi.contractor_id = cc.id
      LEFT JOIN users u ON pi.created_by = u.id
      ORDER BY pi.created_at DESC
    `);

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error in getManufacturingInvoices:', error);
    res.status(500).json({
      message: 'Error fetching manufacturing invoices',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// @desc    Delete assignment
// @route   DELETE /api/manufacturing/assignments/:id
// @access  Private/Admin
exports.deleteAssignment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get the existing assignment
    const [existingAssignment] = await connection.execute(
      'SELECT * FROM cinnamon_assignments WHERE id = ?',
      [req.params.id]
    );

    if (!existingAssignment[0]) {
      await connection.rollback();
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // If assignment has raw materials allocated, return them to inventory
    if (existingAssignment[0].raw_material_id && existingAssignment[0].raw_material_quantity) {
      // Return raw materials to inventory
      await connection.execute(
        'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
        [existingAssignment[0].raw_material_quantity, existingAssignment[0].raw_material_id]
      );

      // Record return transaction
      await connection.execute(
        'INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)',
        [
          existingAssignment[0].raw_material_id,
          'IN',
          existingAssignment[0].raw_material_quantity,
          `CA-${req.params.id}`,
          'Returned from deleted assignment'
        ]
      );
    }

    // Delete the assignment
    await connection.execute(
      'DELETE FROM cinnamon_assignments WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Get all purchases
// @route   GET /api/manufacturing/purchases
// @access  Private
exports.getPurchases = async (req, res) => {
  try {
    const query = `
      SELECT
        pi.id,
        pi.invoice_number,
        pi.invoice_date as date,
        cc.name as contractor_name,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            i.product_name,
            ' (',
            pit.net_weight,
            ' ',
            i.unit,
            ' @ Rs.',
            pit.rate,
            '/kg)'
          )
          SEPARATOR ', '
        ) as product_details,
        GROUP_CONCAT(DISTINCT i.product_name) as product_name,
        CAST(SUM(pit.net_weight) AS DECIMAL(10,2)) as quantity,
        MAX(i.unit) as unit,
        pi.total_amount,
        pi.status,
        pi.advance_payment,
        pi.cutting_rate,
        pi.cutting_charges,
        pi.final_amount
      FROM purchase_invoices pi
      LEFT JOIN cutting_contractors cc ON pi.contractor_id = cc.id
      JOIN purchase_items pit ON pi.id = pit.invoice_id
      JOIN inventory i ON pit.grade_id = i.id
      GROUP BY
        pi.id,
        pi.invoice_number,
        pi.invoice_date,
        cc.name,
        pi.total_amount,
        pi.status,
        pi.advance_payment,
        pi.cutting_rate,
        pi.cutting_charges,
        pi.final_amount
      ORDER BY pi.invoice_date DESC
    `;

    const [purchases] = await pool.query(query);

    // Format the purchase data
    const formattedPurchases = purchases.map(purchase => ({
      ...purchase,
      product_name: purchase.product_name.split(',').join(', '),
      product_details: purchase.product_details,
      date: purchase.date,
      quantity: Number(purchase.quantity).toFixed(2),
      total_amount: Number(purchase.total_amount).toFixed(2),
      advance_payment: Number(purchase.advance_payment || 0).toFixed(2),
      cutting_rate: Number(purchase.cutting_rate || 0).toFixed(2),
      cutting_charges: Number(purchase.cutting_charges || 0).toFixed(2),
      final_amount: Number(purchase.final_amount || 0).toFixed(2)
    }));

    res.json(formattedPurchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({
      message: 'Error fetching purchases',
      error: error.message
    });
  }
};

exports.markPurchaseAsPaid = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Update the purchase_invoices status to paid
    const [updatedRows] = await connection.query(
      `UPDATE purchase_invoices
       SET status = 'paid',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    if (updatedRows.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Get the updated purchase details
    const [purchases] = await connection.query(
      `SELECT pi.*, cc.name as contractor_name
       FROM purchase_invoices pi
       LEFT JOIN cutting_contractors cc ON pi.contractor_id = cc.id
       WHERE pi.id = ?`,
      [id]
    );

    await connection.commit();

    res.json({
      message: 'Purchase marked as paid successfully',
      purchase: purchases[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error in markPurchaseAsPaid:', {
      error: error.message,
      stack: error.stack,
      purchaseId: id
    });
    res.status(500).json({
      message: 'Error marking purchase as paid',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

exports.updateAssignmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Validate status
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Get the current assignment to check if status update is allowed
    const [assignments] = await connection.execute(
      'SELECT * FROM cinnamon_assignments WHERE id = ?',
      [id]
    );

    if (!assignments.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const assignment = assignments[0];

    if (assignment.status !== 'active' && status !== 'active') {
      await connection.rollback();
      return res.status(400).json({
        message: 'Only active assignments can be marked as completed or cancelled'
      });
    }

    // Update the assignment status
    await connection.execute(
      'UPDATE cinnamon_assignments SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    // If marking as cancelled, return raw materials to inventory
    if (status === 'cancelled' && assignment.raw_material_id && assignment.raw_material_quantity) {
      // Return raw materials to inventory
      await connection.execute(
        'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
        [assignment.raw_material_quantity, assignment.raw_material_id]
      );

      // Record inventory transaction
      await connection.execute(
        'INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)',
        [
          assignment.raw_material_id,
          'IN',
          assignment.raw_material_quantity,
          `CA-${id}`,
          'Returned from cancelled assignment'
        ]
      );
    }

    await connection.commit();
    res.json({ message: 'Assignment status updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating assignment status:', error);
    res.status(500).json({ message: 'Error updating assignment status' });
  } finally {
    connection.release();
  }
};