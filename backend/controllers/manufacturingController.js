const ManufacturingContractor = require('../models/domain/ManufacturingContractor');
const { validateContractor, validateAssignment, validateAdvancePayment } = require('../validators/manufacturingValidator');
const { pool } = require('../config/db');
const ManufacturingOrder = require('../models/domain/ManufacturingOrder');
const Inventory = require('../models/domain/Inventory');
const { generateAdvancePaymentReceipt } = require('../utils/receiptTemplates');

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
      'SELECT COUNT(*) as count FROM advance_payments WHERE contractor_id = ?',
      [req.params.id]
    );

    // If there are pending payments or active assignments and forceDelete is not true
    if ((payments[0].count > 0 || assignments.length > 0) && forceDelete !== 'true') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        message: 'Cannot delete contractor with pending payments or active assignments',
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
          'UPDATE advance_payments SET contractor_id = ? WHERE contractor_id = ?',
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
        'UPDATE advance_payments SET contractor_id = ? WHERE contractor_id = ?',
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
    const [rows] = await pool.execute(`
      SELECT ca.*, mc.name as contractor_name
      FROM cinnamon_assignments ca
      JOIN manufacturing_contractors mc ON ca.contractor_id = mc.id
      ORDER BY ca.created_at DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create assignment
// @route   POST /api/manufacturing/assignments
// @access  Private/Admin
exports.createAssignment = async (req, res) => {
  try {
    const { contractor_id, quantity, duration, duration_type, start_date, notes } = req.body;

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

    const [result] = await pool.execute(
      `INSERT INTO cinnamon_assignments 
       (contractor_id, quantity, duration, duration_type, start_date, end_date, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [contractor_id, quantity, duration, duration_type, start_date, end_date, notes]
    );

    const [assignment] = await pool.execute(
      `SELECT ca.*, mc.name as contractor_name
       FROM cinnamon_assignments ca
       JOIN manufacturing_contractors mc ON ca.contractor_id = mc.id
       WHERE ca.id = ?`,
      [result.insertId]
    );

    res.status(201).json(assignment[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update assignment
// @route   PUT /api/manufacturing/assignments/:id
// @access  Private/Admin
exports.updateAssignment = async (req, res) => {
  try {
    const { quantity, duration, duration_type, start_date, notes } = req.body;
    
    const [assignment] = await pool.execute(
      'SELECT * FROM cinnamon_assignments WHERE id = ?',
      [req.params.id]
    );

    if (!assignment[0]) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await pool.execute(
      `UPDATE cinnamon_assignments 
       SET quantity = ?, duration = ?, duration_type = ?, 
           start_date = ?, notes = ?
       WHERE id = ?`,
      [quantity, duration, duration_type, start_date, notes, req.params.id]
    );

    const [updatedAssignment] = await pool.execute(
      `SELECT ca.*, mc.name as contractor_name
       FROM cinnamon_assignments ca
       JOIN manufacturing_contractors mc ON ca.contractor_id = mc.id
       WHERE ca.id = ?`,
      [req.params.id]
    );

    res.status(200).json(updatedAssignment[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get advance payments
// @route   GET /api/manufacturing/advance-payments
// @access  Private
exports.getAdvancePayments = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT ap.*, mc.name as contractor_name
      FROM advance_payments ap
      JOIN manufacturing_contractors mc ON ap.contractor_id = mc.id
      ORDER BY ap.payment_date DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create advance payment
// @route   POST /api/manufacturing/advance-payments
// @access  Private/Admin
exports.createAdvancePayment = async (req, res) => {
  try {
    // Validate the request body
    const { error } = validateAdvancePayment(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { contractor_id, amount, payment_date, notes } = req.body;

    // Check if contractor exists and is active
    const contractor = await ManufacturingContractor.findById(contractor_id);
    if (!contractor || contractor.status !== 'active') {
      return res.status(400).json({ message: 'Invalid or inactive contractor' });
    }

    // Generate receipt number
    const date = new Date(payment_date);
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM advance_payments');
    const count = countResult[0].count + 1;
    const receipt_number = `ADV${year}${month}${count.toString().padStart(4, '0')}`;

    const [result] = await pool.execute(
      `INSERT INTO advance_payments 
       (contractor_id, amount, payment_date, receipt_number, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [contractor_id, amount, payment_date, receipt_number, notes]
    );

    const [payment] = await pool.execute(
      `SELECT ap.*, mc.name as contractor_name, mc.contractor_id as contractor_id
       FROM advance_payments ap
       JOIN manufacturing_contractors mc ON ap.contractor_id = mc.id
       WHERE ap.id = ?`,
      [result.insertId]
    );

    // Generate receipt HTML
    const receiptHtml = generateAdvancePaymentReceipt(payment[0]);

    res.status(201).json({
      ...payment[0],
      receiptHtml
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
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