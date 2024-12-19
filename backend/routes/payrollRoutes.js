const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const SalaryStructure = require('../models/SalaryStructure');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

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
    const { month, year } = req.body;
    const fromDate = new Date(year, month - 1, 1);
    const toDate = new Date(year, month, 0);

    // Check if payroll already exists for this month
    const existingPayroll = await Payroll.findOne({ month, year });
    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll already exists for this month' });
    }

    // Get all active employees
    const employees = await Employee.find({ status: 'active' });
    
    // Create payroll items for each employee
    const payrollItems = await Promise.all(employees.map(async (employee) => {
      // Get employee's salary structure
      const structure = await SalaryStructure.findById(employee.salaryStructure);
      if (!structure) return null;

      const basicSalary = structure.basicSalary;
      let grossSalary = basicSalary;
      const earnings = [];
      const deductions = [];

      // Calculate earnings and deductions
      structure.components.forEach(component => {
        const amount = component.isPercentage ? 
          (basicSalary * component.amount / 100) : 
          component.amount;

        if (component.type === 'earning') {
          earnings.push({ name: component.name, amount });
          grossSalary += amount;
        } else {
          deductions.push({ name: component.name, amount });
        }
      });

      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const netSalary = grossSalary - totalDeductions;

      return {
        employee: employee.id,
        basicSalary,
        earnings,
        deductions,
        grossSalary,
        netSalary,
        status: 'pending',
        paymentDetails: {
          method: 'bank'
        }
      };
    }));

    // Create payroll
    const payroll = await Payroll.create({
      month,
      year,
      fromDate,
      toDate,
      items: payrollItems.filter(item => item !== null),
      createdBy: req.user.id
    });

    res.status(201).json(
      await payroll
        .populate('items.employee')
        .populate('createdBy', 'name')
    );
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

module.exports = router; 