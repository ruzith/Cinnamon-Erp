const CuttingContractor = require('../models/domain/CuttingContractor');
const { validateContractor, validateAssignment } = require('../validators/cuttingValidator');
const CuttingPayment = require('../models/domain/CuttingPayment');

// @desc    Get all contractors
// @route   GET /api/cutting/contractors
// @access  Private
exports.getContractors = async (req, res) => {
  try {
    const contractors = await CuttingContractor.getActiveWithAssignments();
    res.status(200).json(contractors);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const { forceDelete, newContractorId } = req.query;
    await connection.beginTransaction();

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
      WHERE la.contractor_id = ? AND la.status = "active"`,
      [req.params.id]
    );

    // Check for pending payments
    const [payments] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM cutting_payments
      WHERE contractor_id = ? AND status IN ('pending', 'due')`,
      [req.params.id]
    );

    if (payments[0].count > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message: 'Cannot delete contractor with pending payments',
        pendingPayments: payments[0].count
      });
    }

    if (assignments.length > 0) {
      if (forceDelete === 'true' && newContractorId) {
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

        // First update all assignments
        await connection.execute(
          'UPDATE land_assignments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, req.params.id]
        );

        // Then update all payments
        await connection.execute(
          'UPDATE cutting_payments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, req.params.id]
        );

        // Finally delete the contractor
        await connection.execute(
          'DELETE FROM cutting_contractors WHERE id = ?',
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
    } else {
      // No active assignments, but still need to handle any non-active assignments
      // Update any existing assignments first
      if (newContractorId) {
        await connection.execute(
          'UPDATE land_assignments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, req.params.id]
        );

        await connection.execute(
          'UPDATE cutting_payments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, req.params.id]
        );
      }

      // Then delete the contractor
      await connection.execute(
        'DELETE FROM cutting_contractors WHERE id = ?',
        [req.params.id]
      );

      await connection.commit();
      connection.release();

      return res.status(200).json({
        message: 'Contractor deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error in deleteContractor:', error);
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
    const [rows] = await CuttingContractor.pool.execute(`
      SELECT la.*,
             cc.name as contractor_name,
             l.land_number,
             l.location
      FROM land_assignments la
      JOIN cutting_contractors cc ON la.contractor_id = cc.id
      JOIN lands l ON la.land_id = l.id
      ORDER BY la.created_at DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    await CuttingContractor.pool.execute(
      'UPDATE land_assignments SET ? WHERE id = ?',
      [req.body, req.params.id]
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
  try {
    const [assignment] = await CuttingContractor.pool.execute(
      'SELECT * FROM land_assignments WHERE id = ?',
      [req.params.id]
    );

    if (!assignment[0]) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if assignment can be deleted (e.g., not completed or in progress)
    if (assignment[0].status === 'completed' || assignment[0].status === 'in_progress') {
      return res.status(400).json({
        message: 'Cannot delete completed or in-progress assignments'
      });
    }

    await CuttingContractor.pool.execute(
      'DELETE FROM land_assignments WHERE id = ?',
      [req.params.id]
    );

    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

      // Commit transaction
      await connection.commit();

      res.status(200).json({ message: 'Assignment completed and inventory updated successfully' });
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

    // Update the payment
    const [result] = await CuttingPayment.pool.execute(
      `UPDATE cutting_payments
       SET total_amount = ?,
           company_contribution = ?,
           manufacturing_contribution = ?,
           notes = ?,
           status = ?
       WHERE id = ?`,
      [amount, companyContribution, manufacturingContribution, notes, status, req.params.id]
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