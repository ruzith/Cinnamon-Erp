const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { pool } = require('../config/db');
const Payroll = require('../models/domain/Payroll');
const Employee = require('../models/domain/Employee');
const SalaryAdvance = require('../models/domain/SalaryAdvance');

// Generate payroll
router.post('/generate', protect, authorize('admin', 'hr'), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      month,
      year,
      employee_id,
      basic_salary,
      additional_amount = 0,
      deductions = 0,
      net_salary,
      additional_amounts = [],
      deduction_items = []
    } = req.body;

    // Check if payroll already exists
    const [existingPayrolls] = await connection.execute(
      'SELECT id FROM employee_payrolls WHERE month = ? AND year = ? AND employee_id = ?',
      [month, year, employee_id]
    );

    if (existingPayrolls.length > 0) {
      throw new Error('Payroll already exists for this employee in the specified month');
    }

    // Get approved salary advances for the employee
    const [approvedAdvances] = await connection.execute(`
      SELECT id, amount, request_date
      FROM salary_advances
      WHERE employee_id = ?
      AND status = 'approved'`,
      [employee_id]
    );

    // Add salary advances to deduction items
    const advanceDeductions = approvedAdvances.map(advance => ({
      description: `Salary Advance (${new Date(advance.request_date).toLocaleDateString()})`,
      amount: advance.amount,
      advance_id: advance.id
    }));

    const allDeductionItems = [...deduction_items, ...advanceDeductions];
    const totalDeductions = allDeductionItems.reduce((sum, item) => sum + Number(item.amount), 0);

    // Recalculate net salary with advance deductions
    const netSalaryWithAdvances = basic_salary + additional_amount - totalDeductions;

    // Create payroll record
    const [payrollResult] = await connection.execute(
      `INSERT INTO employee_payrolls
       (employee_id, month, year, basic_salary, additional_amount, deductions, net_salary, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [employee_id, month, year, basic_salary, additional_amount, totalDeductions, netSalaryWithAdvances, req.user.id]
    );

    const payrollId = payrollResult.insertId;

    // Insert additional amounts
    if (additional_amounts.length > 0) {
      const additionalValues = additional_amounts.map(item => [
        payrollId, 'addition', item.description, Number(item.amount)
      ]);

      await connection.query(
        `INSERT INTO employee_payroll_items (payroll_id, type, description, amount)
         VALUES ?`,
        [additionalValues]
      );
    }

    // Insert all deduction items including advances
    if (allDeductionItems.length > 0) {
      const deductionValues = allDeductionItems.map(item => [
        payrollId, 'deduction', item.description, Number(item.amount)
      ]);

      await connection.query(
        `INSERT INTO employee_payroll_items (payroll_id, type, description, amount)
         VALUES ?`,
        [deductionValues]
      );
    }

    // Mark salary advances as paid
    if (approvedAdvances.length > 0) {
      const advanceIds = approvedAdvances.map(advance => advance.id);
      await connection.query(
        `UPDATE salary_advances
         SET status = 'paid',
             payment_date = CURRENT_TIMESTAMP,
             payroll_id = ?
         WHERE id IN (?)`,
        [payrollId, advanceIds]
      );
    }

    // Get the created payroll with items
    const [payroll] = await connection.execute(`
      SELECT
        p.*,
        e.name as employee_name,
        d.department,
        GROUP_CONCAT(
          DISTINCT CASE
            WHEN pi.type = 'addition' THEN CONCAT('addition:', pi.description, ':', pi.amount)
          END
        ) as additional_amounts,
        GROUP_CONCAT(
          DISTINCT CASE
            WHEN pi.type = 'deduction' THEN CONCAT('deduction:', pi.description, ':', pi.amount)
          END
        ) as deduction_items
      FROM employee_payrolls p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN designations d ON e.designation_id = d.id
      LEFT JOIN employee_payroll_items pi ON p.id = pi.payroll_id
      WHERE p.id = ?
      GROUP BY p.id`,
      [payrollId]
    );

    await connection.commit();

    // Format the response
    const formattedPayroll = {
      ...payroll[0],
      additional_amounts: payroll[0].additional_amounts ?
        payroll[0].additional_amounts.split(',')
          .filter(Boolean)
          .map(item => {
            const [_, description, amount] = item.split(':');
            return { description, amount: Number(amount) };
          }) : [],
      deduction_items: payroll[0].deduction_items ?
        payroll[0].deduction_items.split(',')
          .filter(Boolean)
          .map(item => {
            const [_, description, amount] = item.split(':');
            return { description, amount: Number(amount) };
          }) : []
    };

    res.status(201).json(formattedPayroll);

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// Approve payroll
router.patch('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    if (payroll.status !== 'processing') {
      return res.status(400).json({ message: 'Payroll must be in processing status to approve' });
    }

    payroll.status = 'approved';
    payroll.approvedBy = req.user.id;
    payroll.approvedAt = new Date();
    await payroll.save();

    res.json(payroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Process payments
router.post('/:id/process-payments', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    if (payroll.status !== 'approved') {
      return res.status(400).json({ message: 'Payroll must be approved before processing payments' });
    }

    // Update payment status for each item
    payroll.items.forEach(item => {
      item.status = 'paid';
      item.paymentDetails.date = new Date();
    });

    payroll.status = 'completed';
    await payroll.save();

    res.json(payroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get payroll details
router.get('/:id', protect, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('items.employee')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    res.json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get employee payroll details
router.get('/employee/:id', protect, async (req, res) => {
  try {
    const employeeId = req.params.id;

    // Get employee's payroll history
    const [payrollHistory] = await Payroll.pool.execute(`
      SELECT p.*, pi.*,
             u1.name as created_by_name,
             u2.name as approved_by_name
      FROM payrolls p
      JOIN payroll_items pi ON p.id = pi.payroll_id
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.approved_by = u2.id
      WHERE pi.employee_id = ?
      ORDER BY p.year DESC, p.month DESC
    `, [employeeId]);

    res.json(payrollHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Calculate employee salary
router.get('/calculate/:employeeId', protect, async (req, res) => {
  try {
    const payroll = new Payroll();
    const salaryDetails = await payroll.calculateEmployeeSalary(req.params.employeeId);
    res.json(salaryDetails);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;