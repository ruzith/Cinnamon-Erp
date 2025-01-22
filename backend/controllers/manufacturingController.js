const ManufacturingContractor = require("../models/domain/ManufacturingContractor");
const {
  validateContractor,
  validateAssignment,
  validateAdvancePayment,
} = require("../validators/manufacturingValidator");
const { pool } = require("../config/db");
const ManufacturingOrder = require("../models/domain/ManufacturingOrder");
const Settings = require("../models/domain/Settings");
const AdvancePayment = require("../models/domain/AdvancePayment");
const { generateManufacturingInvoice } = require("../utils/pdfTemplates");

// @desc    Get all contractors
// @route   GET /api/manufacturing/contractors
// @access  Private
exports.getContractors = async (req, res) => {
  try {
    const contractors =
      await ManufacturingContractor.getActiveWithAssignments();
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
      return res.status(404).json({ message: "Contractor not found" });
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

    const existingContractor = await ManufacturingContractor.findByContractorId(
      req.body.contractor_id
    );
    if (existingContractor) {
      return res.status(400).json({ message: "Contractor ID already exists" });
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
      return res.status(404).json({ message: "Contractor not found" });
    }

    // Check for duplicate contractor ID if it's being changed
    if (
      req.body.contractor_id &&
      req.body.contractor_id !== contractor.contractor_id
    ) {
      const existingContractor =
        await ManufacturingContractor.findByContractorId(
          req.body.contractor_id
        );
      if (existingContractor) {
        return res
          .status(400)
          .json({ message: "Contractor ID already exists" });
      }
    }

    const updatedContractor = await ManufacturingContractor.update(
      req.params.id,
      req.body
    );
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

    // Get all related data
    const [assignments] = await connection.execute(
      'SELECT * FROM cinnamon_assignments WHERE contractor_id = ? AND status = "active"',
      [req.params.id]
    );

    const [advancePayments] = await connection.execute(
      'SELECT * FROM manufacturing_advance_payments WHERE contractor_id = ?',
      [req.params.id]
    );

    const [manufacturingPayments] = await connection.execute(
      'SELECT * FROM manufacturing_payments WHERE contractor_id = ?',
      [req.params.id]
    );

    // If there are pending payments or active assignments and forceDelete is not true
    if (
      (advancePayments.length > 0 || assignments.length > 0 || manufacturingPayments.length > 0) &&
      forceDelete !== 'true'
    ) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message: 'Contractor has related data that needs to be reassigned',
        hasAdvancePayments: advancePayments.length > 0,
        hasAssignments: assignments.length > 0,
        hasManufacturingPayments: manufacturingPayments.length > 0,
        advancePayments,
        assignments,
        manufacturingPayments,
      });
    }

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
      if (assignments.length > 0) {
        await connection.execute(
          'UPDATE cinnamon_assignments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, req.params.id]
        );
      }

      // Update all advance payments
      if (advancePayments.length > 0) {
        await connection.execute(
          'UPDATE manufacturing_advance_payments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, req.params.id]
        );
      }

      // Update all manufacturing payments
      if (manufacturingPayments.length > 0) {
        await connection.execute(
          'UPDATE manufacturing_payments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, req.params.id]
        );
      }
    }

    // Delete the contractor
    await connection.execute(
      'DELETE FROM manufacturing_contractors WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.status(200).json({
      message: 'Contractor deleted successfully',
      reassignedData: {
        assignments: assignments.length > 0 ? assignments : [],
        advancePayments: advancePayments.length > 0 ? advancePayments : [],
        manufacturingPayments: manufacturingPayments.length > 0 ? manufacturingPayments : []
      }
    });
  } catch (error) {
    console.error('Error in deleteContractor:', error);
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
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
    const {
      contractor_id,
      duration,
      duration_type,
      start_date,
      notes,
      raw_material_id,
      raw_material_quantity,
    } = req.body;

    await connection.beginTransaction();

    // Check if there's enough raw material in stock
    const [inventory] = await connection.execute(
      "SELECT * FROM inventory WHERE id = ? AND quantity >= ?",
      [raw_material_id, raw_material_quantity]
    );

    if (!inventory[0]) {
      throw new Error("Insufficient raw material stock");
    }

    // Calculate end date based on duration and duration_type
    const end_date = new Date(start_date);
    switch (duration_type) {
      case "day":
        end_date.setDate(end_date.getDate() + parseInt(duration));
        break;
      case "week":
        end_date.setDate(end_date.getDate() + parseInt(duration) * 7);
        break;
      case "month":
        end_date.setMonth(end_date.getMonth() + parseInt(duration));
        break;
    }

    // Create the assignment (removed quantity from the INSERT)
    const [result] = await connection.execute(
      `INSERT INTO cinnamon_assignments
       (contractor_id, duration, duration_type, start_date, end_date, notes, status, raw_material_id, raw_material_quantity)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [
        contractor_id,
        duration,
        duration_type,
        start_date,
        end_date,
        notes,
        raw_material_id,
        raw_material_quantity,
      ]
    );

    // Deduct raw material from inventory
    await connection.execute(
      "UPDATE inventory SET quantity = quantity - ? WHERE id = ?",
      [raw_material_quantity, raw_material_id]
    );

    // Record inventory transaction
    await connection.execute(
      "INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)",
      [
        raw_material_id,
        "OUT",
        raw_material_quantity,
        `CA-${result.insertId}`,
        "Allocated to contractor assignment",
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
    const {
      duration,
      duration_type,
      start_date,
      notes,
      raw_material_id,
      raw_material_quantity,
    } = req.body;

    await connection.beginTransaction();

    // Get the existing assignment
    const [existingAssignment] = await connection.execute(
      "SELECT * FROM cinnamon_assignments WHERE id = ?",
      [req.params.id]
    );

    if (!existingAssignment[0]) {
      throw new Error("Assignment not found");
    }

    // Calculate end date based on duration and duration_type
    const end_date = new Date(start_date);
    switch (duration_type) {
      case "day":
        end_date.setDate(end_date.getDate() + parseInt(duration));
        break;
      case "week":
        end_date.setDate(end_date.getDate() + parseInt(duration) * 7);
        break;
      case "month":
        end_date.setMonth(end_date.getMonth() + parseInt(duration));
        break;
    }

    // If raw material is being changed or quantity is increased
    if (
      raw_material_id !== existingAssignment[0].raw_material_id ||
      parseFloat(raw_material_quantity) >
        parseFloat(existingAssignment[0].raw_material_quantity)
    ) {
      // Check stock for new material
      const [inventory] = await connection.execute(
        "SELECT * FROM inventory WHERE id = ?",
        [raw_material_id]
      );

      const additionalQuantity =
        parseFloat(raw_material_quantity) -
        parseFloat(existingAssignment[0].raw_material_quantity || 0);

      if (!inventory[0] || inventory[0].quantity < additionalQuantity) {
        throw new Error("Insufficient raw material stock");
      }

      // If material is being changed, return old material to stock
      if (
        raw_material_id !== existingAssignment[0].raw_material_id &&
        existingAssignment[0].raw_material_id
      ) {
        await connection.execute(
          "UPDATE inventory SET quantity = quantity + ? WHERE id = ?",
          [
            existingAssignment[0].raw_material_quantity,
            existingAssignment[0].raw_material_id,
          ]
        );

        // Record return transaction
        await connection.execute(
          "INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)",
          [
            existingAssignment[0].raw_material_id,
            "IN",
            existingAssignment[0].raw_material_quantity,
            `CA-${req.params.id}`,
            "Returned from updated assignment",
          ]
        );
      }

      // Deduct new material from stock
      if (additionalQuantity > 0) {
        await connection.execute(
          "UPDATE inventory SET quantity = quantity - ? WHERE id = ?",
          [additionalQuantity, raw_material_id]
        );

        // Record allocation transaction
        await connection.execute(
          "INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)",
          [
            raw_material_id,
            "OUT",
            additionalQuantity,
            `CA-${req.params.id}`,
            "Additional allocation to updated assignment",
          ]
        );
      }
    }

    // Update the assignment
    await connection.execute(
      `UPDATE cinnamon_assignments
       SET duration = ?,
           duration_type = ?,
           start_date = ?,
           end_date = ?,
           notes = ?,
           raw_material_id = ?,
           raw_material_quantity = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        duration,
        duration_type,
        start_date,
        end_date,
        notes || "",
        raw_material_id,
        raw_material_quantity,
        req.params.id,
      ]
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
    console.error("Error updating assignment:", error);
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
    const [rows] = await pool.execute(`
      SELECT
        map.*,
        mc.name as contractor_name,
        mc.contractor_id as contractor_code
      FROM manufacturing_advance_payments map
      JOIN manufacturing_contractors mc ON map.contractor_id = mc.id
      ORDER BY map.created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching advance payments:", error);
    res.status(500).json({ message: "Error fetching advance payments" });
  }
};

// @desc    Create advance payment
// @route   POST /api/manufacturing/advance-payments
// @access  Private/Admin
exports.createAdvancePayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { contractor_id, amount, notes } = req.body;
    const payment_date = new Date().toISOString().slice(0, 10);

    // Get contractor details - add better error handling
    const [contractors] = await connection.execute(
      "SELECT * FROM manufacturing_contractors WHERE id = ?",
      [contractor_id]
    );

    if (!contractors.length) {
      throw new Error(`Contractor with ID ${contractor_id} not found`);
    }

    const contractor = contractors[0];

    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      throw new Error("Invalid amount");
    }

    // Generate receipt number
    const [lastReceipt] = await connection.execute(
      "SELECT receipt_number FROM manufacturing_advance_payments ORDER BY id DESC LIMIT 1"
    );
    const lastNumber = lastReceipt[0]?.receipt_number?.slice(-4) || "0000";
    const nextNumber = (parseInt(lastNumber) + 1).toString().padStart(4, "0");
    const receipt_number = `MAP${new Date().getFullYear()}${nextNumber}`;

    // Insert payment record with initial status as 'pending'
    const [result] = await connection.execute(
      `INSERT INTO manufacturing_advance_payments
       (contractor_id, amount, payment_date, notes, receipt_number, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [
        contractor_id,
        parseFloat(amount),
        payment_date,
        notes || "",
        receipt_number,
        req.user.id,
      ]
    );

    await connection.commit();

    res.json({
      message: "Advance payment created successfully",
      payment: {
        id: result.insertId,
        contractor_name: contractor.name,
        amount: parseFloat(amount),
        payment_date,
        receipt_number,
        notes,
        status: "pending",
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating advance payment:", error);
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Mark advance payment as paid
// @route   PUT /api/manufacturing/advance-payments/:id/mark-paid
// @access  Private/Admin
exports.markAdvancePaymentAsPaid = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get payment details with contractor info
    const [payment] = await connection.execute(
      `
      SELECT map.*, mc.name as contractor_name, mc.contractor_id as contractor_number
      FROM manufacturing_advance_payments map
      JOIN manufacturing_contractors mc ON map.contractor_id = mc.id
      WHERE map.id = ?
    `,
      [req.params.id]
    );

    if (!payment[0]) {
      await connection.rollback();
      return res.status(404).json({ message: "Payment not found" });
    }

    const paymentData = payment[0];

    if (paymentData.status !== "pending") {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Only pending payments can be marked as paid" });
    }

    // Get the user ID from the request
    const userId = req.user?.id;
    if (!userId) {
      await connection.rollback();
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get required account IDs
    const [accounts] = await connection.execute(`
      SELECT id, code, name
      FROM accounts
      WHERE code IN ('1001', '2001') AND status = 'active'
    `);

    const cashAccountId = accounts.find((acc) => acc.code === "1001")?.id;
    const payablesAccountId = accounts.find((acc) => acc.code === "2001")?.id;

    if (!cashAccountId || !payablesAccountId) {
      await connection.rollback();
      return res.status(400).json({
        message: "Required accounts not found. Please check chart of accounts.",
      });
    }

    // Update payment status
    await connection.execute(
      'UPDATE manufacturing_advance_payments SET status = "paid" WHERE id = ?',
      [req.params.id]
    );

    // Create transaction record
    const [transactionResult] = await connection.execute(
      `
      INSERT INTO transactions (
        date,
        reference,
        description,
        type,
        category,
        amount,
        status,
        payment_method,
        created_by
      ) VALUES (
        CURRENT_DATE(),
        ?,
        ?,
        'expense',
        'manufacturing_advance',
        ?,
        'posted',
        'cash',
        ?
      )
    `,
      [
        `MFG-ADV-${paymentData.id}`,
        `Manufacturing Advance Payment to ${paymentData.contractor_name} (${paymentData.contractor_number})`,
        paymentData.amount,
        userId,
      ]
    );

    const transactionId = transactionResult.insertId;

    // Create transaction entries (double-entry)
    await connection.execute(
      `
      INSERT INTO transactions_entries
        (transaction_id, account_id, description, debit, credit)
      VALUES
        (?, ?, ?, ?, 0),  -- Debit Accounts Payable
        (?, ?, ?, 0, ?)   -- Credit Cash account
    `,
      [
        transactionId,
        payablesAccountId,
        `Advance payment to ${paymentData.contractor_name} (${paymentData.contractor_number})`,
        paymentData.amount,
        transactionId,
        cashAccountId,
        `Advance payment to ${paymentData.contractor_name} (${paymentData.contractor_number})`,
        paymentData.amount,
      ]
    );

    // Update account balances
    await connection.execute(
      "UPDATE accounts SET balance = balance + ? WHERE id = ?",
      [paymentData.amount, payablesAccountId] // Increase Accounts Payable
    );

    await connection.execute(
      "UPDATE accounts SET balance = balance - ? WHERE id = ?",
      [paymentData.amount, cashAccountId] // Decrease Cash account
    );

    await connection.commit();
    res.json({ message: "Payment marked as paid successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error marking payment as paid:", error);
    res.status(500).json({
      message: "Error marking payment as paid",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

exports.startProduction = async (req, res) => {
  try {
    const { orderId, materials } = req.body;
    await ManufacturingOrder.startProduction(orderId, materials);
    res.status(200).json({ message: "Production started successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.completeProduction = async (req, res) => {
  try {
    const { orderId, productData } = req.body;
    await ManufacturingOrder.completeProduction(orderId, productData);
    res.status(200).json({ message: "Production completed successfully" });
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
    const [orders] = await connection.execute(
      `
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
    `,
      [id]
    );

    if (!orders[0]) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orders[0];

    // Get company settings and currency
    const [settings] = await connection.execute(`
      SELECT s.*, c.symbol as currency_symbol
      FROM settings s
      JOIN currencies c ON s.default_currency = c.id
      WHERE c.status = 'active'
      LIMIT 1
    `);
    const companyInfo = settings[0] || {};
    const currencySymbol = companyInfo.currency_symbol || "";

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
          <h1 class="company-name">${
            companyInfo.company_name || "Company Name"
          }</h1>
          <div class="company-details">${
            companyInfo.company_address || "Company Address"
          }</div>
          <div class="company-details">Tel: ${
            companyInfo.company_phone || "N/A"
          }</div>
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
                <span class="product-code">${
                  order.product_code ? `(${order.product_code})` : ""
                }</span>
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
              <div class="info-value">${new Date(
                order.start_date
              ).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">End Date</div>
              <div class="info-value">${
                order.end_date
                  ? new Date(order.end_date).toLocaleDateString()
                  : "N/A"
              }</div>
            </div>
          </div>
        </div>

        <div class="amount-section">
          <div class="amount-label">Total Amount</div>
          <div class="amount-value">${currencySymbol} ${totalAmount}</div>
        </div>

        <div class="footer">
          <p>Created by: ${
            order.created_by_name || "System"
          } | Generated on: ${new Date().toLocaleString()}</p>
          <p>This is a computer generated receipt</p>
        </div>
      </body>
      </html>
    `;

    res.json({ receiptHtml });
  } catch (error) {
    console.error("Error generating order receipt:", error);
    res.status(500).json({
      message: "Error generating receipt",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orders[0];

    if (order.status !== "completed") {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Only completed orders can be marked as paid" });
    }

    if (order.payment_status === "paid") {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Order is already marked as paid" });
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
            "IN",
            order.quantity,
            `MO-${order.order_number}`,
            `Production completed from manufacturing order ${order.order_number}`,
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
           (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)`,
          [
            inventoryItemId,
            "IN",
            order.quantity,
            `MO-${order.order_number}`,
            `Production completed from manufacturing order ${order.order_number}`,
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
      message: "Order marked as paid successfully",
      order: {
        ...order,
        payment_status: "paid",
        payment_date: new Date(),
        inventory_updated: true,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error marking order as paid:", error);
    res.status(500).json({
      message: "Error marking order as paid",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    connection.release();
  }
};

// @desc    Print invoice
// @route   GET /api/manufacturing/invoices/:id/print
// @access  Private
exports.printInvoice = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    // Get invoice details with contractor info
    const [invoices] = await connection.execute(
      `
      SELECT
        pi.*,
        mc.name as contractor_name,
        mc.contractor_id,
        mc.phone as contractor_phone,
        mc.address as contractor_address,
        u.name as created_by_name
      FROM purchase_invoices pi
      JOIN manufacturing_contractors mc ON pi.contractor_id = mc.id
      LEFT JOIN users u ON pi.created_by = u.id
      WHERE pi.id = ?
    `,
      [id]
    );

    if (!invoices[0]) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Get invoice items with their details
    const [items] = await connection.execute(
      `
      SELECT
        pit.*,
        i.product_name,
        i.unit
      FROM purchase_items pit
      JOIN inventory i ON pit.grade_id = i.id
      WHERE pit.invoice_id = ?
    `,
      [id]
    );

    const invoice = {
      ...invoices[0],
      items: items.map((item) => ({
        ...item,
        total_weight: Number(item.total_weight),
        deduct_weight1: Number(item.deduct_weight1),
        deduct_weight2: Number(item.deduct_weight2),
        net_weight: Number(item.net_weight),
        rate: Number(item.rate),
        amount: Number(item.amount),
      })),
    };

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
    const invoiceHtml = await generateManufacturingInvoice(invoice, settings);

    res.json({ invoiceHtml });
  } catch (error) {
    console.error("Error printing invoice:", error);
    res.status(500).json({
      message: "Error printing invoice",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    connection.release();
  }
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
    const assignmentReports = rows.map((assignment) => {
      // Calculate efficiency based on assignment status
      let efficiency = "0.00";
      if (assignment.status === "completed") {
        efficiency =
          assignment.raw_material_quantity > 0
            ? (
                (assignment.quantity / assignment.raw_material_quantity) *
                100
              ).toFixed(2)
            : "0.00";
      } else if (assignment.status === "active") {
        // For active assignments, show target/expected efficiency
        efficiency =
          assignment.raw_material_quantity > 0
            ? (
                (assignment.quantity / assignment.raw_material_quantity) *
                100
              ).toFixed(2) + "*" // Add asterisk to indicate target
            : "0.00";
      } else if (assignment.status === "cancelled") {
        efficiency = "N/A"; // Not applicable for cancelled assignments
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
        notes: assignment.notes || "N/A",
      };

      // Add progress indicators for active assignments
      if (assignment.status === "active") {
        const startDate = new Date(assignment.start_date);
        const endDate = new Date(assignment.end_date);
        const currentDate = new Date();

        // Calculate time progress
        const totalDuration = endDate - startDate;
        const elapsed = currentDate - startDate;
        const timeProgress = Math.min(
          Math.max((elapsed / totalDuration) * 100, 0),
          100
        );

        summary.timeProgress = timeProgress.toFixed(1) + "%";
        summary.remainingDays = Math.max(
          Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)),
          0
        );
      }

      return {
        ...assignment,
        efficiency,
        summary,
      };
    });

    res.status(200).json(assignmentReports);
  } catch (error) {
    console.error("Error generating assignment reports:", error);
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
    const [rows] = await pool.execute(
      `
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
    `,
      [id]
    );

    const assignment = rows[0];
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Calculate efficiency
    let efficiency = "0.00";
    if (assignment.status === "completed") {
      efficiency =
        assignment.raw_material_quantity > 0
          ? (
              (assignment.quantity / assignment.raw_material_quantity) *
              100
            ).toFixed(2)
          : "0.00";
    } else if (assignment.status === "active") {
      efficiency =
        assignment.raw_material_quantity > 0
          ? (
              (assignment.quantity / assignment.raw_material_quantity) *
              100
            ).toFixed(2) + "*"
          : "0.00";
    } else if (assignment.status === "cancelled") {
      efficiency = "N/A";
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
                <span>${new Date(
                  assignment.start_date
                ).toLocaleDateString()}</span>
              </div>
              <div class="info-item">
                <span class="label">End Date:</span>
                <span>${new Date(
                  assignment.end_date
                ).toLocaleDateString()}</span>
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
                <span>${efficiency}${
      assignment.status === "active" ? " (Target)" : ""
    }</span>
              </div>
              <div class="info-item">
                <span class="label">Duration:</span>
                <span>${assignment.duration} ${
      assignment.duration_type
    }(s)</span>
              </div>
              <div class="info-item">
                <span class="label">Status:</span>
                <span class="status status-${assignment.status}">
                  ${
                    assignment.status.charAt(0).toUpperCase() +
                    assignment.status.slice(1)
                  }
                </span>
              </div>
            </div>
          </div>

          ${
            assignment.notes
              ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <div>${assignment.notes}</div>
          </div>
          `
              : ""
          }

          ${
            assignment.status === "active"
              ? `
          <div class="section">
            <div class="section-title">Progress Tracking</div>
            <div class="grid">
              <div class="info-item">
                <span class="label">Time Progress:</span>
                <span>${calculateTimeProgress(
                  assignment.start_date,
                  assignment.end_date
                )}%</span>
              </div>
              <div class="info-item">
                <span class="label">Remaining Days:</span>
                <span>${calculateRemainingDays(assignment.end_date)} days</span>
              </div>
            </div>
          </div>
          `
              : ""
          }

          <div class="footer">
            <p>Created by: ${
              assignment.created_by_name || "System"
            } | Generated on: ${new Date().toLocaleString()}</p>
            <p>This is a computer generated receipt</p>
          </div>
        </body>
      </html>
    `;

    res.json({ reportHtml });
  } catch (error) {
    console.error("Error printing assignment report:", error);
    res.status(500).json({ message: "Error printing report" });
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

    if (status === "unused") {
      payments = await AdvancePayment.getUnusedPaymentsByContractor(
        req.params.id
      );
    } else {
      const [rows] = await pool.execute(
        `
        SELECT ap.*, mc.name as contractor_name
        FROM manufacturing_advance_payments ap
        JOIN manufacturing_contractors mc ON ap.contractor_id = mc.id
        WHERE ap.contractor_id = ?
        ORDER BY ap.payment_date DESC
      `,
        [req.params.id]
      );
      payments = rows;
    }

    // Calculate total unused advance amount
    const totalUnusedAdvance = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount || 0),
      0
    );

    res.status(200).json({
      payments,
      totalUnusedAdvance: parseFloat(totalUnusedAdvance.toFixed(2)),
    });
  } catch (error) {
    console.error("Error fetching advance payments:", error);
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
      contractor_id,
      items,
      cutting_rate,
      status,
      notes,
      subtotal,
      cutting_charges,
      final_amount,
      total_net_weight,
      advance_payment_ids // Add this to receive the selected advance payment IDs
    } = req.body;

    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const [lastInvoice] = await connection.query(
      "SELECT invoice_number FROM purchase_invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1",
      [`PUR${year}${month}%`]
    );

    let invoiceNumber;
    if (lastInvoice.length > 0) {
      const lastNumber = parseInt(lastInvoice[0].invoice_number.slice(-4));
      invoiceNumber = `PUR${year}${month}${(lastNumber + 1).toString().padStart(4, '0')}`;
    } else {
      invoiceNumber = `PUR${year}${month}0001`;
    }

    // Calculate total advance payment amount
    let totalAdvanceAmount = 0;
    if (advance_payment_ids && advance_payment_ids.length > 0) {
      const [advancePayments] = await connection.execute(
        `SELECT SUM(amount) as total FROM cutting_advance_payments
         WHERE id IN (${advance_payment_ids.map(() => '?').join(',')})
         AND status = 'paid'`,
        advance_payment_ids
      );
      totalAdvanceAmount = advancePayments[0]?.total || 0;
    }

    // Insert purchase invoice with values from payload
    const [invoice] = await connection.execute(
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
        contractor_id,
        subtotal,
        subtotal, // total_amount is same as subtotal
        cutting_rate,
        cutting_charges,
        totalAdvanceAmount,
        final_amount,
        status,
        notes || '',
        req.user.id
      ]
    );

    const invoiceId = invoice.insertId;

    // Insert purchase items
    for (const item of items) {
      if (item.grade && item.total_weight) {
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
            item.deduct_weight1 || 0,
            item.deduct_weight2 || 0,
            item.net_weight,
            item.rate,
            item.amount
          ]
        );
      }
    }

    // Handle advance payments if any
    if (advance_payment_ids && advance_payment_ids.length > 0) {
      // Update advance payments status to 'used'
      await connection.execute(
        `UPDATE cutting_advance_payments
         SET status = 'used',
             used_in_invoice = ?,
             used_date = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id IN (${advance_payment_ids.map(() => '?').join(',')})`,
        [invoiceId, ...advance_payment_ids]
      );

      // Create payment usage records
      for (const advanceId of advance_payment_ids) {
        const [advancePayment] = await connection.execute(
          'SELECT amount FROM cutting_advance_payments WHERE id = ?',
          [advanceId]
        );

        if (advancePayment[0]) {
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
      invoice_number: invoiceNumber,
      details: {
        subtotal,
        totalAmount: subtotal,
        cuttingCharges: cutting_charges,
        finalAmount: final_amount,
        advancePaymentAmount: totalAdvanceAmount
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating purchase invoice:', error);
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
      data: invoices,
    });
  } catch (error) {
    console.error("Error in getManufacturingInvoices:", error);
    res.status(500).json({
      message: "Error fetching manufacturing invoices",
      error: error.message,
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

    // Check if assignment exists
    const [existingAssignment] = await connection.execute(
      "SELECT * FROM cinnamon_assignments WHERE id = ?",
      [req.params.id]
    );

    if (!existingAssignment[0]) {
      await connection.rollback();
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check for related payments
    const [relatedPayments] = await connection.execute(
      "SELECT * FROM manufacturing_payments WHERE assignment_id = ?",
      [req.params.id]
    );

    if (relatedPayments.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "Cannot delete assignment with related payments. Please delete the payments first.",
        relatedPayments
      });
    }

    // If assignment has raw materials allocated, return them to inventory
    if (
      existingAssignment[0].raw_material_id &&
      existingAssignment[0].raw_material_quantity
    ) {
      // Return raw materials to inventory
      await connection.execute(
        "UPDATE inventory SET quantity = quantity + ? WHERE id = ?",
        [
          existingAssignment[0].raw_material_quantity,
          existingAssignment[0].raw_material_id,
        ]
      );

      // Record return transaction
      await connection.execute(
        "INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)",
        [
          existingAssignment[0].raw_material_id,
          "IN",
          existingAssignment[0].raw_material_quantity,
          `CA-${req.params.id}`,
          "Returned from deleted assignment",
        ]
      );
    }

    // Delete the assignment
    await connection.execute("DELETE FROM cinnamon_assignments WHERE id = ?", [
      req.params.id,
    ]);

    await connection.commit();
    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting assignment:", error);
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
    // Get currency symbol first
    const [settingsResult] = await pool.query(`
      SELECT c.symbol as currency_symbol
      FROM settings s
      JOIN currencies c ON s.default_currency = c.id
      WHERE c.status = 'active'
      LIMIT 1
    `);
    const currencySymbol = settingsResult[0]?.currency_symbol || "";

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
            ' @ ',
            '${currencySymbol}',
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
    const formattedPurchases = purchases.map((purchase) => ({
      ...purchase,
      product_name: purchase.product_name.split(",").join(", "),
      product_details: purchase.product_details,
      date: purchase.date,
      quantity: Number(purchase.quantity).toFixed(2),
      total_amount: Number(purchase.total_amount).toFixed(2),
      advance_payment: Number(purchase.advance_payment || 0).toFixed(2),
      cutting_rate: Number(purchase.cutting_rate || 0).toFixed(2),
      cutting_charges: Number(purchase.cutting_charges || 0).toFixed(2),
      final_amount: Number(purchase.final_amount || 0).toFixed(2),
    }));

    res.json(formattedPurchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({
      message: "Error fetching purchases",
      error: error.message,
    });
  }
};

exports.markPurchaseAsPaid = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get purchase details with contractor info
    const [purchases] = await connection.query(
      `
      SELECT pi.*, mc.name as contractor_name, mc.contractor_id as contractor_number
      FROM purchase_invoices pi
      LEFT JOIN manufacturing_contractors mc ON pi.contractor_id = mc.id
      WHERE pi.id = ?
    `,
      [id]
    );

    if (purchases.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Purchase not found" });
    }

    const purchase = purchases[0];

    // Get the user ID from the request
    const userId = req.user?.id;
    if (!userId) {
      await connection.rollback();
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get required account IDs
    const [accounts] = await connection.execute(`
      SELECT id, code, name
      FROM accounts
      WHERE code IN ('1001', '5002') AND status = 'active'
    `);

    const cashAccountId = accounts.find((acc) => acc.code === "1001")?.id;
    const manufacturingExpenseId = accounts.find(
      (acc) => acc.code === "5002"
    )?.id;

    if (!cashAccountId || !manufacturingExpenseId) {
      await connection.rollback();
      return res.status(400).json({
        message: "Required accounts not found. Please check chart of accounts.",
      });
    }

    // Update purchase status
    await connection.execute(
      `UPDATE purchase_invoices
       SET status = 'paid',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    // Create transaction record
    const [transactionResult] = await connection.execute(
      `
      INSERT INTO transactions (
        date,
        reference,
        description,
        type,
        category,
        amount,
        status,
        payment_method,
        created_by
      ) VALUES (
        CURRENT_DATE(),
        ?,
        ?,
        'expense',
        'manufacturing_purchase',
        ?,
        'posted',
        'cash',
        ?
      )
    `,
      [
        `PUR-${purchase.id}`,
        `Purchase Payment to ${purchase.contractor_name} (${purchase.contractor_number})`,
        purchase.total_amount,
        userId,
      ]
    );

    const transactionId = transactionResult.insertId;

    // Create transaction entries (double-entry)
    await connection.execute(
      `
      INSERT INTO transactions_entries
        (transaction_id, account_id, description, debit, credit)
      VALUES
        (?, ?, ?, ?, 0),  -- Debit Manufacturing Expense
        (?, ?, ?, 0, ?)   -- Credit Cash account
    `,
      [
        transactionId,
        manufacturingExpenseId,
        `Purchase payment to ${purchase.contractor_name} (${purchase.contractor_number})`,
        purchase.total_amount,
        transactionId,
        cashAccountId,
        `Purchase payment to ${purchase.contractor_name} (${purchase.contractor_number})`,
        purchase.total_amount,
      ]
    );

    // Update account balances
    await connection.execute(
      "UPDATE accounts SET balance = balance + ? WHERE id = ?",
      [purchase.total_amount, manufacturingExpenseId] // Increase Manufacturing Expense
    );

    await connection.execute(
      "UPDATE accounts SET balance = balance - ? WHERE id = ?",
      [purchase.total_amount, cashAccountId] // Decrease Cash account
    );

    await connection.commit();

    res.json({
      message: "Purchase marked as paid successfully",
      purchase: purchase,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error in markPurchaseAsPaid:", {
      error: error.message,
      stack: error.stack,
      purchaseId: id,
    });
    res.status(500).json({
      message: "Error marking purchase as paid",
      error: error.message,
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
    if (!["active", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Get the current assignment to check if status update is allowed
    const [assignments] = await connection.execute(
      "SELECT * FROM cinnamon_assignments WHERE id = ?",
      [id]
    );

    if (!assignments.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Assignment not found" });
    }

    const assignment = assignments[0];

    if (assignment.status !== "active" && status !== "active") {
      await connection.rollback();
      return res.status(400).json({
        message:
          "Only active assignments can be marked as completed or cancelled",
      });
    }

    // Update the assignment status
    await connection.execute(
      "UPDATE cinnamon_assignments SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, id]
    );

    // If marking as cancelled, return raw materials to inventory
    if (
      status === "cancelled" &&
      assignment.raw_material_id &&
      assignment.raw_material_quantity
    ) {
      // Return raw materials to inventory
      await connection.execute(
        "UPDATE inventory SET quantity = quantity + ? WHERE id = ?",
        [assignment.raw_material_quantity, assignment.raw_material_id]
      );

      // Record inventory transaction
      await connection.execute(
        "INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)",
        [
          assignment.raw_material_id,
          "IN",
          assignment.raw_material_quantity,
          `CA-${id}`,
          "Returned from cancelled assignment",
        ]
      );
    }

    await connection.commit();
    res.json({ message: "Assignment status updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating assignment status:", error);
    res.status(500).json({ message: "Error updating assignment status" });
  } finally {
    connection.release();
  }
};

// @desc    Complete manufacturing assignment and update inventory
// @route   POST /api/manufacturing/assignments/complete
// @access  Private/Admin
exports.completeAssignment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { assignment_id, finished_good_id, quantity_received } = req.body;

    // Start transaction
    await connection.beginTransaction();

    try {
      // Get assignment details first
      const [assignment] = await connection.execute(
        `
        SELECT ma.*, mc.name as contractor_name
        FROM cinnamon_assignments ma
        JOIN manufacturing_contractors mc ON ma.contractor_id = mc.id
        WHERE ma.id = ?
      `,
        [assignment_id]
      );

      if (!assignment[0]) {
        throw new Error("Assignment not found");
      }

      // Update assignment status
      const updateAssignmentQuery = `
        UPDATE cinnamon_assignments
        SET status = 'completed',
            updated_at = NOW(),
            finished_good_id = ?,
            quantity = ?
        WHERE id = ?
      `;
      await connection.execute(updateAssignmentQuery, [
        finished_good_id,
        quantity_received,
        assignment_id,
      ]);

      // Add finished good to inventory
      const updateFinishedGoodQuery = `
        UPDATE inventory
        SET quantity = quantity + ?
        WHERE id = ?
      `;
      await connection.execute(updateFinishedGoodQuery, [
        quantity_received,
        finished_good_id,
      ]);

      // Create inventory transaction records
      // For finished good (IN)
      await connection.execute(
        `INSERT INTO inventory_transactions
         (item_id, type, quantity, reference, notes)
         VALUES (?, 'IN', ?, ?, ?)`,
        [
          finished_good_id,
          quantity_received,
          `MFG-${assignment_id}`,
          `Produced from manufacturing by ${assignment[0].contractor_name}`,
        ]
      );

      // Commit transaction
      await connection.commit();

      res.status(200).json({
        message: "Assignment completed and inventory updated successfully",
        details: {
          assignment_id,
          finished_good_id,
          quantity_received,
          contractor_name: assignment[0].contractor_name,
        },
      });
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
};

// @desc    Update advance payment
// @route   PUT /api/manufacturing/advance-payments/:id
// @access  Private/Admin
exports.updateAdvancePayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [payment] = await connection.execute(
      "SELECT * FROM manufacturing_advance_payments WHERE id = ?",
      [req.params.id]
    );

    if (!payment[0]) {
      throw new Error("Payment not found");
    }

    if (!["pending", "paid"].includes(payment[0].status)) {
      throw new Error("Only pending or paid payments can be updated");
    }

    const { amount, notes } = req.body;

    await connection.execute(
      `UPDATE manufacturing_advance_payments
       SET amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [amount, notes, req.params.id]
    );

    await connection.commit();
    res.json({ message: "Advance payment updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating advance payment:", error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Delete advance payment
// @route   DELETE /api/manufacturing/advance-payments/:id
// @access  Private/Admin
exports.deleteAdvancePayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [payment] = await connection.execute(
      "SELECT * FROM manufacturing_advance_payments WHERE id = ?",
      [req.params.id]
    );

    if (!payment[0]) {
      throw new Error("Payment not found");
    }

    if (!["pending", "paid"].includes(payment[0].status)) {
      throw new Error("Only pending or paid payments can be deleted");
    }

    await connection.execute(
      "DELETE FROM manufacturing_advance_payments WHERE id = ?",
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: "Advance payment deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting advance payment:", error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// Add this new endpoint
exports.getContractorRelatedData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const contractorId = req.params.id;

    // Get all related data in parallel
    const [[assignments], [advancePayments], [purchaseInvoices]] =
      await Promise.all([
        connection.execute(
          'SELECT ca.*, i.product_name as raw_material_name FROM cinnamon_assignments ca LEFT JOIN inventory i ON ca.raw_material_id = i.id WHERE ca.contractor_id = ? AND ca.status = "active"',
          [contractorId]
        ),
        connection.execute(
          "SELECT * FROM manufacturing_advance_payments WHERE contractor_id = ?",
          [contractorId]
        ),
        connection.execute(
          "SELECT * FROM purchase_invoices WHERE contractor_id = ?",
          [contractorId]
        ),
      ]);

    const hasRelatedData =
      assignments.length > 0 ||
      advancePayments.length > 0 ||
      purchaseInvoices.length > 0;

    res.json({
      hasRelatedData,
      assignments,
      advancePayments,
      purchaseInvoices,
    });
  } catch (error) {
    console.error("Error getting contractor related data:", error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

exports.markPaymentAsPaid = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get payment details
    const [paymentDetails] = await connection.execute(
      `
      SELECT mp.*, mc.name as contractor_name, mc.contractor_id as contractor_number
      FROM manufacturing_payments mp
      JOIN manufacturing_contractors mc ON mp.contractor_id = mc.id
      WHERE mp.id = ?
    `,
      [req.params.id]
    );

    if (!paymentDetails[0]) {
      await connection.rollback();
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = paymentDetails[0];

    // Get the user ID from the request
    const userId = req.user?.id;
    if (!userId) {
      await connection.rollback();
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get required account IDs
    const [accounts] = await connection.execute(`
      SELECT id, code, name
      FROM accounts
      WHERE code IN ('1001', '5002') AND status = 'active'
    `);

    const cashAccountId = accounts.find((acc) => acc.code === "1001")?.id;
    const manufacturingExpenseId = accounts.find(
      (acc) => acc.code === "5002"
    )?.id;

    if (!cashAccountId || !manufacturingExpenseId) {
      await connection.rollback();
      return res.status(400).json({
        message: "Required accounts not found. Please check chart of accounts.",
      });
    }

    // Update payment status
    await connection.execute(
      'UPDATE manufacturing_payments SET status = "paid" WHERE id = ?',
      [req.params.id]
    );

    // Create transaction record
    const [transactionResult] = await connection.execute(
      `
      INSERT INTO transactions (
        date,
        reference,
        description,
        type,
        category,
        amount,
        status,
        payment_method,
        created_by
      ) VALUES (
        CURRENT_DATE(),
        ?,
        ?,
        'expense',
        'manufacturing_payment',
        ?,
        'posted',
        'cash',
        ?
      )
    `,
      [
        `MFG-PAY-${payment.id}`,
        `Manufacturing Payment to ${payment.contractor_name} (${payment.contractor_number})`,
        payment.amount,
        userId,
      ]
    );

    const transactionId = transactionResult.insertId;

    // Create transaction entries (double-entry)
    await connection.execute(
      `
      INSERT INTO transactions_entries
        (transaction_id, account_id, description, debit, credit)
      VALUES
        (?, ?, ?, ?, 0),  -- Debit Manufacturing Expense
        (?, ?, ?, 0, ?)   -- Credit Cash account
    `,
      [
        transactionId,
        manufacturingExpenseId,
        `Manufacturing payment to ${payment.contractor_name} (${payment.contractor_number})`,
        payment.amount,
        transactionId,
        cashAccountId,
        `Manufacturing payment to ${payment.contractor_name} (${payment.contractor_number})`,
        payment.amount,
      ]
    );

    // Update account balances
    await connection.execute(
      "UPDATE accounts SET balance = balance + ? WHERE id = ?",
      [payment.amount, manufacturingExpenseId] // Increase Manufacturing Expense
    );

    await connection.execute(
      "UPDATE accounts SET balance = balance - ? WHERE id = ?",
      [payment.amount, cashAccountId] // Decrease Cash account
    );

    await connection.commit();
    res.json({ message: "Payment marked as paid successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error marking payment as paid:", error);
    res.status(500).json({
      message: "Error marking payment as paid",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};
