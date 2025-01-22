const CuttingContractor = require('../models/domain/CuttingContractor');
const { validateContractor, validateAssignment } = require('../validators/cuttingValidator');
const CuttingPayment = require('../models/domain/CuttingPayment');
const pool = require('../config/database');
const { generateCuttingPaymentReceipt } = require('../utils/pdfTemplates');

// @desc    Get all contractors
// @route   GET /api/cutting/contractors
// @access  Private
exports.getContractors = async (req, res) => {
  try {
    const includeContribution = req.query.include_contribution === 'true';

    const baseQuery = `
      SELECT
        cc.*,
        COUNT(DISTINCT CASE WHEN la.status = 'active' THEN la.id END) as active_assignments,
        GROUP_CONCAT(DISTINCT CASE WHEN la.status = 'active' THEN l.land_number END) as assigned_lands
    `;

    const contributionQuery = includeContribution ? `,
        (SELECT cp.manufacturing_contribution / cp.quantity_kg AS latest_manufacturing_contribution
         FROM cutting_payments cp
         WHERE cp.contractor_id = cc.id
         ORDER BY cp.created_at DESC
         LIMIT 1) AS latest_manufacturing_contribution
    ` : '';

    const query = `
      ${baseQuery}
      ${contributionQuery}
      FROM cutting_contractors cc
      LEFT JOIN land_assignments la ON cc.id = la.contractor_id
      LEFT JOIN lands l ON la.land_id = l.id
      GROUP BY cc.id
      ORDER BY cc.name ASC
    `;

    const [contractors] = await CuttingContractor.pool.execute(query);
    res.json(contractors);
  } catch (error) {
    console.error('Error fetching contractors:', error);
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
};

// @desc    Get single contractor
// @route   GET /api/cutting/contractors/:id
// @access  Private
exports.getContractor = async (req, res) => {
  try {
    const contractor = await CuttingContractor.findById(req.params.id);
    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }
    res.status(200).json(contractor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create contractor
// @route   POST /api/cutting/contractors
// @access  Private/Admin
exports.createContractor = async (req, res) => {
  try {
    const { error } = validateContractor(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingContractor = await CuttingContractor.findByContractorId(req.body.contractor_id);
    if (existingContractor) {
      return res.status(400).json({ message: 'Contractor ID already exists' });
    }

    const contractor = await CuttingContractor.create(req.body);
    res.status(201).json(contractor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update contractor
// @route   PUT /api/cutting/contractors/:id
// @access  Private/Admin
exports.updateContractor = async (req, res) => {
  try {
    const { error } = validateContractor(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const contractor = await CuttingContractor.findById(req.params.id);
    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    // Check for duplicate contractor ID if it's being changed
    if (req.body.contractor_id && req.body.contractor_id !== contractor.contractor_id) {
      const existingContractor = await CuttingContractor.findByContractorId(req.body.contractor_id);
      if (existingContractor) {
        return res.status(400).json({ message: 'Contractor ID already exists' });
      }
    }

    const updatedContractor = await CuttingContractor.update(req.params.id, req.body);
    res.status(200).json(updatedContractor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete contractor
// @route   DELETE /api/cutting/contractors/:id
// @access  Private/Admin
exports.deleteContractor = async (req, res) => {
  const connection = await CuttingContractor.pool.getConnection();

  try {
    const contractor = await CuttingContractor.findById(req.params.id);
    if (!contractor) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Contractor not found' });
    }

    // Check for active assignments
    const [assignments] = await connection.execute(`
      SELECT la.*, l.land_number
      FROM land_assignments la
      JOIN lands l ON la.land_id = l.id
      WHERE la.contractor_id = ?`,
      [req.params.id]
    );

    // Check for pending payments
    const [payments] = await connection.execute(`
      SELECT *
      FROM cutting_payments
      WHERE contractor_id = ?`,
      [req.params.id]
    );

    // Check for advance payments
    const [advancePayments] = await connection.execute(`
      SELECT *
      FROM cutting_advance_payments
      WHERE contractor_id = ?`,
      [req.params.id]
    );

    // Check for purchase invoices
    const [purchaseInvoices] = await connection.execute(`
      SELECT *
      FROM purchase_invoices
      WHERE contractor_id = ?`,
      [req.params.id]
    );

    // If there are any related records, return them to the frontend
    if (payments.length > 0 || advancePayments.length > 0 || assignments.length > 0 || purchaseInvoices.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        hasPayments: payments.length > 0,
        hasAdvancePayments: advancePayments.length > 0,
        hasAssignments: assignments.length > 0,
        hasPurchaseInvoices: purchaseInvoices.length > 0,
        payments: payments,
        advancePayments: advancePayments,
        assignments: assignments,
        purchaseInvoices: purchaseInvoices,
        message: 'Contractor has payments, advance payments, assignments, or purchase invoices that need to be reassigned.'
      });
    }

    // If no related records, proceed with deletion
    await connection.execute(
      'DELETE FROM cutting_contractors WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    connection.release();

    return res.status(200).json({
      message: 'Contractor deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteContractor:', error);
    await connection.rollback();
    connection.release();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reassign contractor data and delete
// @route   POST /api/cutting/contractors/:id/reassign
// @access  Private/Admin
exports.reassignContractor = async (req, res) => {
  const connection = await CuttingContractor.pool.getConnection();

  try {
    const { newContractorId } = req.body;
    await connection.beginTransaction();

    // Verify new contractor exists and is active
    const [newContractor] = await connection.execute(
      'SELECT * FROM cutting_contractors WHERE id = ? AND status = "active"',
      [newContractorId]
    );

    if (!newContractor[0]) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: 'Invalid or inactive new contractor' });
    }

    // Update land assignments
    await connection.execute(
      'UPDATE land_assignments SET contractor_id = ? WHERE contractor_id = ?',
      [newContractorId, req.params.id]
    );

    // Update cutting payments
    await connection.execute(
      'UPDATE cutting_payments SET contractor_id = ? WHERE contractor_id = ?',
      [newContractorId, req.params.id]
    );

    // Update advance payments
    await connection.execute(
      'UPDATE cutting_advance_payments SET contractor_id = ? WHERE contractor_id = ?',
      [newContractorId, req.params.id]
    );

    // Update purchase invoices
    await connection.execute(
      'UPDATE purchase_invoices SET contractor_id = ? WHERE contractor_id = ?',
      [newContractorId, req.params.id]
    );

    // Delete the contractor
    await connection.execute(
      'DELETE FROM cutting_contractors WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    connection.release();

    return res.status(200).json({
      message: 'Contractor data reassigned and deleted successfully'
    });
  } catch (error) {
    console.error('Error in reassignContractor:', error);
    await connection.rollback();
    connection.release();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all assignments
// @route   GET /api/cutting/assignments
// @access  Private
exports.getAssignments = async (req, res) => {
  try {
    const { contractor_name, start_date, end_date } = req.query;

    let query = `
      SELECT
        la.*,
        cc.name as contractor_name,
        l.land_number,
        l.location
      FROM land_assignments la
      JOIN cutting_contractors cc ON la.contractor_id = cc.id
      JOIN lands l ON la.land_id = l.id
      WHERE 1=1
    `;

    const params = [];

    if (contractor_name) {
      query += ` AND cc.name LIKE ?`;
      params.push(`%${contractor_name}%`);
    }

    if (start_date) {
      query += ` AND la.start_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND la.end_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY la.created_at DESC`;

    const [assignments] = await CuttingContractor.pool.execute(query, params);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching cutting assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments' });
  }
};

// @desc    Create assignment
// @route   POST /api/cutting/assignments
// @access  Private/Admin
exports.createAssignment = async (req, res) => {
  try {
    const { error } = validateAssignment(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if contractor exists and is active
    const contractor = await CuttingContractor.findById(req.body.contractor_id);
    if (!contractor || contractor.status !== 'active') {
      return res.status(400).json({ message: 'Invalid or inactive contractor' });
    }

    // Check if land exists and is active
    const [land] = await CuttingContractor.pool.execute(
      'SELECT * FROM lands WHERE id = ? AND status = "active"',
      [req.body.land_id]
    );
    if (!land[0]) {
      return res.status(400).json({ message: 'Invalid or inactive land' });
    }

    // Check if land is already assigned
    const [existingAssignment] = await CuttingContractor.pool.execute(
      'SELECT * FROM land_assignments WHERE land_id = ? AND status = "active"',
      [req.body.land_id]
    );
    if (existingAssignment[0]) {
      return res.status(400).json({ message: 'Land is already assigned' });
    }

    // Insert the assignment with explicit column names
    const [result] = await CuttingContractor.pool.execute(
      `INSERT INTO land_assignments
       (contractor_id, land_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.body.contractor_id,
        req.body.land_id,
        req.body.start_date,
        req.body.end_date,
        req.body.status
      ]
    );

    // Get the created assignment with details
    const [assignment] = await CuttingContractor.pool.execute(
      `SELECT la.*, cc.name as contractor_name, l.land_number, l.location
       FROM land_assignments la
       JOIN cutting_contractors cc ON la.contractor_id = cc.id
       JOIN lands l ON la.land_id = l.id
       WHERE la.id = ?`,
      [result.insertId]
    );

    res.status(201).json(assignment[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update assignment
// @route   PUT /api/cutting/assignments/:id
// @access  Private/Admin
exports.updateAssignment = async (req, res) => {
  try {
    const { error } = validateAssignment(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const [assignment] = await CuttingContractor.pool.execute(
      'SELECT * FROM land_assignments WHERE id = ?',
      [req.params.id]
    );

    if (!assignment[0]) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // If changing contractor, check if new contractor exists and is active
    if (req.body.contractor_id && req.body.contractor_id !== assignment[0].contractor_id) {
      const contractor = await CuttingContractor.findById(req.body.contractor_id);
      if (!contractor || contractor.status !== 'active') {
        return res.status(400).json({ message: 'Invalid or inactive contractor' });
      }
    }

    // If changing land, check if new land exists, is active, and not already assigned
    if (req.body.land_id && req.body.land_id !== assignment[0].land_id) {
      const [land] = await CuttingContractor.pool.execute(
        'SELECT * FROM lands WHERE id = ? AND status = "active"',
        [req.body.land_id]
      );
      if (!land[0]) {
        return res.status(400).json({ message: 'Invalid or inactive land' });
      }

      const [existingAssignment] = await CuttingContractor.pool.execute(
        'SELECT * FROM land_assignments WHERE land_id = ? AND status = "active" AND id != ?',
        [req.body.land_id, req.params.id]
      );
      if (existingAssignment[0]) {
        return res.status(400).json({ message: 'Land is already assigned' });
      }
    }

    // Update the assignment
    await CuttingContractor.pool.execute(
      `UPDATE land_assignments
       SET contractor_id = ?, land_id = ?, start_date = ?, end_date = ?, status = ?
       WHERE id = ?`,
      [
        req.body.contractor_id,
        req.body.land_id,
        req.body.start_date,
        req.body.end_date,
        req.body.status,
        req.params.id
      ]
    );

    const [updatedAssignment] = await CuttingContractor.pool.execute(
      `SELECT la.*, cc.name as contractor_name, l.land_number, l.location
       FROM land_assignments la
       JOIN cutting_contractors cc ON la.contractor_id = cc.id
       JOIN lands l ON la.land_id = l.id
       WHERE la.id = ?`,
      [req.params.id]
    );

    res.status(200).json(updatedAssignment[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/cutting/assignments/:id
// @access  Private/Admin
exports.deleteAssignment = async (req, res) => {
  const connection = await CuttingContractor.pool.getConnection();

  try {
    await connection.beginTransaction();

    const [assignment] = await connection.execute(
      'SELECT * FROM land_assignments WHERE id = ?',
      [req.params.id]
    );

    if (!assignment[0]) {
      await connection.rollback();
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // First delete all related payments
    await connection.execute(
      'DELETE FROM cutting_payments WHERE assignment_id = ?',
      [req.params.id]
    );

    // Then delete the assignment
    await connection.execute(
      'DELETE FROM land_assignments WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.status(200).json({ message: 'Assignment and related payments deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Get all tasks
// @route   GET /api/cutting/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const [rows] = await CuttingContractor.pool.execute(`
      SELECT ct.*,
             la.start_date,
             la.end_date,
             cc.name as contractor_name,
             l.land_number,
             l.location
      FROM cutting_tasks ct
      JOIN land_assignments la ON ct.assignment_id = la.id
      JOIN cutting_contractors cc ON la.contractor_id = cc.id
      JOIN lands l ON la.land_id = l.id
      ORDER BY ct.created_at DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/cutting/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const [rows] = await CuttingContractor.pool.execute(
      `SELECT ct.*,
              la.start_date,
              la.end_date,
              cc.name as contractor_name,
              l.land_number,
              l.location
       FROM cutting_tasks ct
       JOIN land_assignments la ON ct.assignment_id = la.id
       JOIN cutting_contractors cc ON la.contractor_id = cc.id
       JOIN lands l ON la.land_id = l.id
       WHERE ct.id = ?`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create task
// @route   POST /api/cutting/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    // Check if assignment exists and is active
    const [assignment] = await CuttingContractor.pool.execute(
      'SELECT * FROM land_assignments WHERE id = ? AND status = "active"',
      [req.body.assignment_id]
    );

    if (!assignment[0]) {
      return res.status(400).json({ message: 'Invalid or inactive assignment' });
    }

    const [result] = await CuttingContractor.pool.execute(
      'INSERT INTO cutting_tasks SET ?',
      [{
        ...req.body,
        created_by: req.user.id,
        status: 'pending'
      }]
    );

    const [task] = await CuttingContractor.pool.execute(
      `SELECT ct.*,
              la.start_date,
              la.end_date,
              cc.name as contractor_name,
              l.land_number,
              l.location
       FROM cutting_tasks ct
       JOIN land_assignments la ON ct.assignment_id = la.id
       JOIN cutting_contractors cc ON la.contractor_id = cc.id
       JOIN lands l ON la.land_id = l.id
       WHERE ct.id = ?`,
      [result.insertId]
    );

    res.status(201).json(task[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/cutting/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const [task] = await CuttingContractor.pool.execute(
      'SELECT * FROM cutting_tasks WHERE id = ?',
      [req.params.id]
    );

    if (!task[0]) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await CuttingContractor.pool.execute(
      'UPDATE cutting_tasks SET ? WHERE id = ?',
      [req.body, req.params.id]
    );

    const [updatedTask] = await CuttingContractor.pool.execute(
      `SELECT ct.*,
              la.start_date,
              la.end_date,
              cc.name as contractor_name,
              l.land_number,
              l.location
       FROM cutting_tasks ct
       JOIN land_assignments la ON ct.assignment_id = la.id
       JOIN cutting_contractors cc ON la.contractor_id = cc.id
       JOIN lands l ON la.land_id = l.id
       WHERE ct.id = ?`,
      [req.params.id]
    );

    res.status(200).json(updatedTask[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/cutting/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res) => {
  try {
    const [task] = await CuttingContractor.pool.execute(
      'SELECT * FROM cutting_tasks WHERE id = ?',
      [req.params.id]
    );

    if (!task[0]) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task can be deleted (e.g., not completed)
    if (task[0].status === 'completed') {
      return res.status(400).json({
        message: 'Cannot delete completed tasks'
      });
    }

    await CuttingContractor.pool.execute(
      'DELETE FROM cutting_tasks WHERE id = ?',
      [req.params.id]
    );

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create payment
// @route   POST /api/cutting/payments
// @access  Private/Admin/Accountant
exports.createPayment = async (req, res) => {
  try {
    // Check if contractor exists and is active
    const contractor = await CuttingContractor.findById(req.body.contractor_id);
    if (!contractor || contractor.status !== 'active') {
      return res.status(400).json({ message: 'Invalid or inactive contractor' });
    }

    // Check if assignment exists and belongs to the contractor
    const [assignment] = await CuttingContractor.pool.execute(
      'SELECT * FROM land_assignments WHERE id = ? AND contractor_id = ?',
      [req.body.assignment_id, req.body.contractor_id]
    );
    if (!assignment[0]) {
      return res.status(400).json({ message: 'Invalid assignment for this contractor' });
    }

    const paymentData = {
      contractor_id: req.body.contractor_id,
      assignment_id: req.body.assignment_id,
      total_amount: req.body.amount,
      company_contribution: req.body.companyContribution,
      manufacturing_contribution: req.body.manufacturingContribution,
      quantity_kg: req.body.quantity_kg,
      status: req.body.status,
      payment_date: new Date(),
      notes: req.body.notes,
      created_by: req.user.id
    };

    const payment = await CuttingPayment.create(paymentData);
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all payments
// @route   GET /api/cutting/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    const [rows] = await CuttingPayment.pool.execute(`
      SELECT cp.*,
             cc.name as contractor_name,
             l.land_number,
             l.location,
             u.name as created_by_name
      FROM cutting_payments cp
      LEFT JOIN cutting_contractors cc ON cp.contractor_id = cc.id
      LEFT JOIN land_assignments la ON cp.assignment_id = la.id
      LEFT JOIN lands l ON la.land_id = l.id
      LEFT JOIN users u ON cp.created_by = u.id
      ORDER BY cp.payment_date DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payments by contractor
// @route   GET /api/cutting/payments/contractor/:id
// @access  Private
exports.getPaymentsByContractor = async (req, res) => {
  try {
    const payments = await CuttingPayment.findByContractor(req.params.id);
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete cutting assignment and update inventory
// @route   POST /api/cutting/assignments/complete
// @access  Private
exports.completeAssignment = async (req, res) => {
  const connection = await CuttingContractor.pool.getConnection();

  try {
    const { assignment_id, raw_item_id, quantity_received } = req.body;

    // Start transaction
    await connection.beginTransaction();

    try {
      // Get assignment details first
      const [assignment] = await connection.execute(`
        SELECT la.*, l.land_number, cc.name as contractor_name
        FROM land_assignments la
        JOIN lands l ON la.land_id = l.id
        JOIN cutting_contractors cc ON la.contractor_id = cc.id
        WHERE la.id = ?
      `, [assignment_id]);

      if (!assignment[0]) {
        throw new Error('Assignment not found');
      }

      // Update assignment status
      const updateAssignmentQuery = `
        UPDATE land_assignments
        SET status = 'completed',
            completed_at = NOW(),
            raw_item_id = ?,
            quantity_received = ?
        WHERE id = ?
      `;
      await connection.execute(updateAssignmentQuery, [raw_item_id, quantity_received, assignment_id]);

      // Add to inventory
      const updateInventoryQuery = `
        UPDATE inventory
        SET quantity = quantity + ?
        WHERE id = ?
      `;
      await connection.execute(updateInventoryQuery, [quantity_received, raw_item_id]);

      // Create inventory transaction record
      const [inventoryItem] = await connection.execute(
        'SELECT product_name FROM inventory WHERE id = ?',
        [raw_item_id]
      );

      await connection.execute(
        `INSERT INTO inventory_transactions
         (item_id, type, quantity, reference, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          raw_item_id,
          'IN',
          quantity_received,
          `CUT-${assignment[0].land_number}`,
          `Raw material received from cutting operation at ${assignment[0].land_number} by ${assignment[0].contractor_name}`
        ]
      );

      // Commit transaction
      await connection.commit();

      res.status(200).json({
        message: 'Assignment completed and inventory updated successfully',
        details: {
          assignment_id,
          raw_item_id,
          quantity_received,
          product_name: inventoryItem[0]?.product_name,
          land_number: assignment[0].land_number,
          contractor_name: assignment[0].contractor_name
        }
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

// @desc    Create advance payment
// @route   POST /api/cutting/advance-payments
// @access  Private/Admin/Accountant
exports.createAdvancePayment = async (req, res) => {
  const connection = await CuttingContractor.pool.getConnection();

  try {
    await connection.beginTransaction();

    const { contractor_id, amount, notes, status = 'pending' } = req.body;

    // Validate required fields
    if (!contractor_id || !amount) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: 'Contractor ID and amount are required' });
    }

    // Check if contractor exists and is active
    const [contractor] = await connection.execute(
      'SELECT * FROM cutting_contractors WHERE id = ? AND status = "active"',
      [contractor_id]
    );

    if (!contractor[0]) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: 'Invalid or inactive contractor' });
    }

    // Insert advance payment
    const [result] = await connection.execute(
      `INSERT INTO cutting_advance_payments
       (contractor_id, amount, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [contractor_id, amount, notes, status]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      id: result.insertId,
      contractor_id,
      amount,
      notes,
      status,
      created_at: new Date()
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all advance payments
// @route   GET /api/cutting/advance-payments
// @access  Private
exports.getAdvancePayments = async (req, res) => {
  try {
    const [rows] = await CuttingContractor.pool.execute(`
      SELECT cap.*,
             cc.name as contractor_name,
             cc.contractor_id as contractor_number
      FROM cutting_advance_payments cap
      JOIN cutting_contractors cc ON cap.contractor_id = cc.id
      ORDER BY cap.created_at DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get advance payments by contractor
// @route   GET /api/cutting/advance-payments/contractor/:id
// @access  Private
exports.getAdvancePaymentsByContractor = async (req, res) => {
  try {
    const [rows] = await CuttingContractor.pool.execute(`
      SELECT cap.*,
             cc.name as contractor_name,
             cc.contractor_id as contractor_number
      FROM cutting_advance_payments cap
      JOIN cutting_contractors cc ON cap.contractor_id = cc.id
      WHERE cap.contractor_id = ?
      ORDER BY cap.created_at DESC
    `, [req.params.id]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete payment
// @route   DELETE /api/cutting/payments/:id
// @access  Private/Admin/Accountant
exports.deletePayment = async (req, res) => {
  try {
    const [result] = await CuttingPayment.pool.execute(
      'DELETE FROM cutting_payments WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete advance payment
// @route   DELETE /api/cutting/advance-payments/:id
// @access  Private/Admin/Accountant
exports.deleteAdvancePayment = async (req, res) => {
  try {
    const [result] = await CuttingPayment.pool.execute(
      'DELETE FROM cutting_advance_payments WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Advance payment not found' });
    }

    res.status(200).json({ message: 'Advance payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update advance payment
// @route   PUT /api/cutting/advance-payments/:id
// @access  Private/Admin/Accountant
exports.updateAdvancePayment = async (req, res) => {
  try {
    const { amount, notes, status } = req.body;

    // Check if advance payment exists
    const [existingPayment] = await CuttingPayment.pool.execute(
      'SELECT * FROM cutting_advance_payments WHERE id = ?',
      [req.params.id]
    );

    if (!existingPayment[0]) {
      return res.status(404).json({ message: 'Advance payment not found' });
    }

    // Update the advance payment
    const [result] = await CuttingPayment.pool.execute(
      `UPDATE cutting_advance_payments
       SET amount = ?, notes = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [amount, notes, status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Advance payment not found' });
    }

    // Fetch and return the updated payment
    const [updatedPayment] = await CuttingPayment.pool.execute(`
      SELECT cap.*,
             cc.name as contractor_name,
             cc.contractor_id as contractor_number
      FROM cutting_advance_payments cap
      JOIN cutting_contractors cc ON cap.contractor_id = cc.id
      WHERE cap.id = ?
    `, [req.params.id]);

    res.status(200).json(updatedPayment[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update payment
// @route   PUT /api/cutting/payments/:id
// @access  Private/Admin/Accountant
exports.updatePayment = async (req, res) => {
  try {
    const { amount, companyContribution, manufacturingContribution, notes, status } = req.body;

    // Check if payment exists
    const [existingPayment] = await CuttingPayment.pool.execute(
      'SELECT * FROM cutting_payments WHERE id = ?',
      [req.params.id]
    );

    if (!existingPayment[0]) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Prepare the update data
    const updateData = {
      total_amount: amount,
      company_contribution: companyContribution,
      manufacturing_contribution: manufacturingContribution,
      notes: notes,
      status: status,
      quantity_kg: req.body.quantity_kg
    };

    // Remove undefined properties
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update the payment
    const [result] = await CuttingPayment.pool.execute(
      `UPDATE cutting_payments
      SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}
      WHERE id = ?`,
      [...Object.values(updateData), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Fetch and return the updated payment
    const [updatedPayment] = await CuttingPayment.pool.execute(`
      SELECT cp.*,
             cc.name as contractor_name,
             l.land_number,
             l.location,
             u.name as created_by_name
      FROM cutting_payments cp
      LEFT JOIN cutting_contractors cc ON cp.contractor_id = cc.id
      LEFT JOIN land_assignments la ON cp.assignment_id = la.id
      LEFT JOIN lands l ON la.land_id = l.id
      LEFT JOIN users u ON cp.created_by = u.id
      WHERE cp.id = ?
    `, [req.params.id]);

    res.status(200).json(updatedPayment[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single payment
// @route   GET /api/cutting/payments/:id
// @access  Private
exports.getPayment = async (req, res) => {
  try {
    const payment = await CuttingPayment.getWithDetails(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate receipt for cutting payment
// @route   POST /api/cutting/payments/receipt
// @access  Private
exports.generateReceipt = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { payment } = req.body;

    // Get company settings and currency
    const [settingsResult] = await connection.execute(`
      SELECT s.*, c.symbol as currency_symbol
      FROM settings s
      JOIN currencies c ON s.default_currency = c.id
      WHERE c.status = 'active'
      LIMIT 1
    `);
    const settings = settingsResult[0] || {};

    // Get payment details if not provided in full
    if (!payment.contractor_name || !payment.land_number) {
      const [paymentDetails] = await connection.execute(`
        SELECT
          cp.*,
          cc.name as contractor_name,
          cc.contractor_id as contractor_number,
          l.land_number,
          l.location
        FROM cutting_payments cp
        LEFT JOIN cutting_contractors cc ON cp.contractor_id = cc.id
        LEFT JOIN land_assignments la ON cp.assignment_id = la.id
        LEFT JOIN lands l ON la.land_id = l.id
        WHERE cp.id = ?
      `, [payment.id]);

      if (paymentDetails[0]) {
        Object.assign(payment, paymentDetails[0]);
      }
    }

    const receiptHtml = await generateCuttingPaymentReceipt(payment, settings);
    res.json({ receiptHtml });
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ message: 'Error generating receipt' });
  } finally {
    if (connection) connection.release();
  }
};

// @desc    Get contractor advance payments
// @route   GET /api/cutting/contractors/:id/advance-payments
// @access  Private
exports.getContractorAdvancePayments = async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.query.status;

    let query = `
      SELECT cap.*,
             cc.name as contractor_name,
             cc.contractor_id as contractor_number
      FROM cutting_advance_payments cap
      JOIN cutting_contractors cc ON cap.contractor_id = cc.id
      WHERE cap.contractor_id = ?
    `;

    if (status) {
      query += ` AND cap.status = ?`;
    }

    query += ` ORDER BY cap.created_at DESC`;

    const [payments] = await CuttingContractor.pool.execute(
      query,
      status ? [id, status] : [id]
    );

    // Calculate total unused advance
    const totalUnusedAdvance = payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount || 0);
    }, 0);

    res.json({
      payments,
      totalUnusedAdvance
    });
  } catch (error) {
    console.error('Error fetching contractor advance payments:', error);
    res.status(500).json({ error: 'Failed to fetch advance payments' });
  }
};

// @desc    Mark advance payment as paid
// @route   PUT /api/cutting/advance-payments/:id/mark-paid
// @access  Private/Admin/Accountant
exports.markAdvancePaymentAsPaid = async (req, res) => {
  const connection = await CuttingContractor.pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Get advance payment details with user info
    const [advancePayment] = await connection.execute(`
      SELECT cap.*, cc.name as contractor_name, cc.contractor_id as contractor_number
      FROM cutting_advance_payments cap
      JOIN cutting_contractors cc ON cap.contractor_id = cc.id
      WHERE cap.id = ?
    `, [id]);

    if (!advancePayment[0]) {
      await connection.rollback();
      return res.status(404).json({ message: 'Advance payment not found' });
    }

    const payment = advancePayment[0];

    // Get the user ID from the request
    const userId = req.user?.id;
    if (!userId) {
      await connection.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get required account IDs
    const [accounts] = await connection.execute(`
      SELECT id, code, name
      FROM accounts
      WHERE code IN ('1001', '2001') AND status = 'active'
    `);

    const cashAccountId = accounts.find(acc => acc.code === '1001')?.id;
    const payablesAccountId = accounts.find(acc => acc.code === '2001')?.id;

    if (!cashAccountId || !payablesAccountId) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Required accounts not found. Please check chart of accounts.'
      });
    }

    // Update advance payment status
    await connection.execute(
      'UPDATE cutting_advance_payments SET status = ?, updated_at = NOW() WHERE id = ?',
      ['paid', id]
    );

    // Create transaction record
    const [transactionResult] = await connection.execute(`
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
        'cutting_advance',
        ?,
        'posted',
        'cash',
        ?
      )
    `, [
      `ADV-${payment.id}`,
      `Cutting Advance Payment to ${payment.contractor_name} (${payment.contractor_number})`,
      payment.amount,
      userId
    ]);

    const transactionId = transactionResult.insertId;

    // Create transaction entries (double-entry)
    await connection.execute(`
      INSERT INTO transactions_entries
        (transaction_id, account_id, description, debit, credit)
      VALUES
        (?, ?, ?, ?, 0),  -- Debit Accounts Payable
        (?, ?, ?, 0, ?)   -- Credit Cash account
    `, [
      transactionId,
      payablesAccountId,
      `Advance payment to ${payment.contractor_name} (${payment.contractor_number})`,
      payment.amount,
      transactionId,
      cashAccountId,
      `Advance payment to ${payment.contractor_name} (${payment.contractor_number})`,
      payment.amount
    ]);

    // Update account balances
    await connection.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [payment.amount, payablesAccountId] // Increase Accounts Payable
    );

    await connection.execute(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [payment.amount, cashAccountId] // Decrease Cash account
    );

    await connection.commit();

    // Fetch updated payment details
    const [updatedPayment] = await connection.execute(`
      SELECT
        cap.*,
        cc.name as contractor_name,
        cc.contractor_id as contractor_number
      FROM cutting_advance_payments cap
      JOIN cutting_contractors cc ON cap.contractor_id = cc.id
      WHERE cap.id = ?
    `, [id]);

    res.json(updatedPayment[0]);

  } catch (error) {
    await connection.rollback();
    console.error('Error marking advance payment as paid:', error);
    res.status(500).json({
      message: 'Error marking advance payment as paid',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// @desc    Mark payment as paid
// @route   PUT /api/cutting/payments/:id/mark-paid
// @access  Private/Admin/Accountant
exports.markPaymentAsPaid = async (req, res) => {
  const connection = await CuttingContractor.pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Get payment details
    const [paymentDetails] = await connection.execute(`
      SELECT cp.*, cc.name as contractor_name, cc.contractor_id as contractor_number
      FROM cutting_payments cp
      JOIN cutting_contractors cc ON cp.contractor_id = cc.id
      WHERE cp.id = ?
    `, [id]);

    if (!paymentDetails[0]) {
      await connection.rollback();
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = paymentDetails[0];

    // Get the user ID from the request
    const userId = req.user?.id;
    if (!userId) {
      await connection.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get required account IDs
    const [accounts] = await connection.execute(`
      SELECT id, code, name
      FROM accounts
      WHERE code IN ('1001', '5002') AND status = 'active'
    `);

    const cashAccountId = accounts.find(acc => acc.code === '1001')?.id;
    const manufacturingExpenseId = accounts.find(acc => acc.code === '5002')?.id;

    if (!cashAccountId || !manufacturingExpenseId) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Required accounts not found. Please check chart of accounts.'
      });
    }

    // Update payment status
    await connection.execute(
      'UPDATE cutting_payments SET status = ?, updated_at = NOW() WHERE id = ?',
      ['paid', id]
    );

    // Create transaction record for company contribution
    const [companyTransactionResult] = await connection.execute(`
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
        'cutting_payment',
        ?,
        'posted',
        'cash',
        ?
      )
    `, [
      `CUT-${payment.id}-COM`,
      `Cutting Payment (Company) to ${payment.contractor_name} (${payment.contractor_number})`,
      payment.company_contribution,
      userId
    ]);

    // Create transaction entries for company contribution
    await connection.execute(`
      INSERT INTO transactions_entries (transaction_id, account_id, description, debit, credit)
      VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
    `, [
      companyTransactionResult.insertId,
      manufacturingExpenseId,
      `Cutting payment to ${payment.contractor_name} (${payment.contractor_number})`,
      payment.company_contribution,
      0,
      companyTransactionResult.insertId,
      cashAccountId,
      `Cutting payment to ${payment.contractor_name} (${payment.contractor_number})`,
      0,
      payment.company_contribution
    ]);

    // Create transaction record for manufacturing contribution
    const [mfgTransactionResult] = await connection.execute(`
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
        'manufacturing_payment',
        'cutting_payment',
        ?,
        'posted',
        'cash',
        ?
      )
    `, [
      `CUT-${payment.id}-MFG`,
      `Cutting Payment (Manufacturing) to ${payment.contractor_name} (${payment.contractor_number})`,
      payment.manufacturing_contribution,
      userId
    ]);

    // Create transaction entries for manufacturing contribution
    await connection.execute(`
      INSERT INTO transactions_entries (transaction_id, account_id, description, debit, credit)
      VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
    `, [
      mfgTransactionResult.insertId,
      manufacturingExpenseId,
      `Manufacturing contribution for ${payment.contractor_name} (${payment.contractor_number})`,
      payment.manufacturing_contribution,
      0,
      mfgTransactionResult.insertId,
      cashAccountId,
      `Manufacturing contribution for ${payment.contractor_name} (${payment.contractor_number})`,
      0,
      payment.manufacturing_contribution
    ]);

    // Update account balances
    await connection.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [payment.total_amount, manufacturingExpenseId] // Increase Manufacturing Expense account
    );

    await connection.execute(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [payment.total_amount, cashAccountId] // Decrease Cash account
    );

    await connection.commit();

    // Fetch updated payment details
    const [updatedPayment] = await connection.execute(`
      SELECT cp.*,
             cc.name as contractor_name,
             cc.contractor_id as contractor_number,
             l.land_number,
             l.location
      FROM cutting_payments cp
      LEFT JOIN cutting_contractors cc ON cp.contractor_id = cc.id
      LEFT JOIN land_assignments la ON cp.assignment_id = la.id
      LEFT JOIN lands l ON la.land_id = l.id
      WHERE cp.id = ?
    `, [id]);

    res.json(updatedPayment[0]);

  } catch (error) {
    await connection.rollback();
    console.error('Error marking payment as paid:', error);
    res.status(500).json({
      message: 'Error marking payment as paid',
      error: error.message
    });
  } finally {
    connection.release();
  }
};