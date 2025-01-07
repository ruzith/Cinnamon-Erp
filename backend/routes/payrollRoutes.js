const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const SalaryStructure = require('../models/domain/SalaryStructure');
const Payroll = require('../models/domain/Payroll');
const Employee = require('../models/domain/Employee');
const SalaryAdvance = require('../models/domain/SalaryAdvance');

// Salary Structure routes
router.get('/structures', protect, async (req, res) => {
  try {
    const structures = await SalaryStructure.find({ status: 'active' });
    res.json(structures);
  } catch (error) {
    console.error('Error fetching salary structures:', error);
    res.status(500).json({
      message: 'Error fetching salary structures',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.post('/structures', protect, authorize('admin', 'hr'), async (req, res) => {
  try {
    const structure = await SalaryStructure.create(req.body);
    res.status(201).json(structure);
  } catch (error) {
    console.error('Error creating salary structure:', error);
    res.status(400).json({ message: 'Error creating salary structure' });
  }
});

// Generate payroll
router.post('/generate', protect, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { month, year, employeeId, additionalAmounts = [], deductionItems = [] } = req.body;

    // Check if payroll already exists
    const [existingPayrolls] = await Payroll.pool.execute(
      'SELECT id FROM employee_payrolls WHERE month = ? AND year = ? AND employee_id = ?',
      [month, year, employeeId]
    );

    if (existingPayrolls.length > 0) {
      return res.status(400).json({
        message: 'Payroll already exists for this employee in the specified month'
      });
    }

    // Get employee details
    const [employees] = await Employee.pool.execute(
      'SELECT * FROM employees WHERE id = ?',
      [employeeId]
    );
    const employee = employees[0];
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get approved salary advances for the month
    const [advances] = await SalaryAdvance.pool.execute(
      `SELECT * FROM salary_advances
       WHERE employee_id = ?
       AND approval_status = 'approved'
       AND request_date >= ?
       AND request_date <= ?`,
      [employeeId,
       new Date(year, month - 1, 1).toISOString(),
       new Date(year, month, 0).toISOString()]
    );

    // Calculate totals
    const basicSalary = Number(employee.basic_salary);
    const totalAdditional = additionalAmounts.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalAdvances = advances.reduce((sum, advance) => sum + Number(advance.amount), 0);
    const totalDeductions = deductionItems.reduce((sum, item) => sum + Number(item.amount), 0) + totalAdvances;

    const grossSalary = basicSalary + totalAdditional;
    const netSalary = grossSalary - totalDeductions;

    // Create payroll record
    const [payrollResult] = await Payroll.pool.execute(
      `INSERT INTO employee_payrolls
       (employee_id, month, year, basic_salary, gross_salary, net_salary, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, month, year, basicSalary, grossSalary, netSalary, 'draft', req.user.id]
    );

    const payrollId = payrollResult.insertId;

    // Insert payroll items
    const itemValues = [
      // Additional amounts
      ...additionalAmounts.map(item => [
        payrollId, 'earning', item.description, Number(item.amount)
      ]),
      // Deduction items
      ...deductionItems.map(item => [
        payrollId, 'deduction', item.description, Number(item.amount)
      ]),
      // Salary advances
      ...advances.map(advance => [
        payrollId, 'deduction', 'Salary Advance', Number(advance.amount)
      ])
    ];

    if (itemValues.length > 0) {
      await Payroll.pool.execute(
        `INSERT INTO payroll_items (payroll_id, type, description, amount)
         VALUES ${itemValues.map(() => '(?, ?, ?, ?)').join(', ')}`,
        itemValues.flat()
      );
    }

    // Get the created payroll with items
    const [payroll] = await Payroll.pool.execute(
      `SELECT p.*, GROUP_CONCAT(pi.type, ':', pi.description, ':', pi.amount) as items
       FROM employee_payrolls p
       LEFT JOIN payroll_items pi ON p.id = pi.payroll_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [payrollId]
    );

    res.status(201).json({
      payroll: payroll[0],
      items: payroll[0].items ? payroll[0].items.split(',').map(item => {
        const [type, description, amount] = item.split(':');
        return { type, description, amount: Number(amount) };
      }) : []
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
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