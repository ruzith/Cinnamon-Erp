const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { pool } = require('../config/db');
const SalaryAdvance = require('../models/domain/SalaryAdvance');
const Payroll = require('../models/domain/Payroll');
const {
  approvePayroll,
  getPayrollById,
  generatePayrollPrint
} = require('../controllers/hrController');
const { deletePayroll } = require('../controllers/payrollController');
const { generatePayrollSlip } = require('../utils/pdfTemplates');

const salaryAdvanceModel = new SalaryAdvance();
const payrollModel = new Payroll();

// Salary Advance Routes
router.get('/salary-advances', protect, async (req, res) => {
  try {
    const advances = await salaryAdvanceModel.getWithDetails();
    res.json(advances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/salary-advances/employee/:id', protect, async (req, res) => {
  try {
    const advances = await salaryAdvanceModel.getByEmployeeId(req.params.id);
    res.json(advances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/salary-advances', protect, async (req, res) => {
  try {
    const result = await salaryAdvanceModel.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/salary-advances/:id/approve', [protect, authorize('admin', 'hr')], async (req, res) => {
  try {
    const result = await salaryAdvanceModel.approve(req.params.id, req.user.id);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/salary-advances/:id/reject', [protect, authorize('admin', 'hr')], async (req, res) => {
  try {
    const result = await salaryAdvanceModel.reject(req.params.id, req.user.id);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Payroll Routes
router.get('/payroll', protect, async (req, res) => {
  try {
    const payrolls = await payrollModel.getWithDetails();
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/payroll/employee/:id', protect, async (req, res) => {
  try {
    const payrolls = await payrollModel.getByEmployeeId(req.params.id);
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/payroll', [protect, authorize('admin', 'hr')], async (req, res) => {
  try {
    const { items, ...payrollData } = req.body;

    // Check if payroll already exists for the employee, month, and year
    const existingPayroll = await pool.query(
      'SELECT * FROM employee_payrolls WHERE employee_id = ? AND month = ? AND year = ?',
      [payrollData.employee_id, payrollData.month, payrollData.year]
    );

    if (existingPayroll[0].length > 0) {
      return res.status(400).json({ message: 'Payroll record already exists for this employee for the specified month and year.' });
    }

    const result = await payrollModel.createPayroll(payrollData, items);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/payroll/:id/status', [protect, authorize('admin', 'hr')], async (req, res) => {
  try {
    const { status, paymentDate } = req.body;
    const result = await payrollModel.updateStatus(req.params.id, status, paymentDate);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/reports/payroll', [protect, authorize('admin', 'hr')], async (req, res) => {
  try {
    const filters = {
      employeeId: req.query.employeeId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const report = await payrollModel.getPayrollReport(filters);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/reports/employee', [protect, authorize('admin', 'hr')], async (req, res) => {
  try {
    const filters = {
      employeeId: req.query.employeeId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Get employee details with work hours and salary information
    let query = `
      SELECT
        e.*,
        COALESCE(SUM(wh.hours_worked), 0) as total_hours,
        COALESCE(SUM(CASE WHEN sa.approval_status = 'approved' THEN sa.amount ELSE 0 END), 0) as total_advances,
        COUNT(DISTINCT CASE WHEN sa.approval_status = 'approved' THEN sa.id END) as advance_count,
        MAX(p.basic_salary) as basic_salary,
        MAX(p.deductions) as deductions,
        MAX(p.net_salary) as net_salary
      FROM employees e
      LEFT JOIN employee_work_hours wh ON e.id = wh.employee_id
        AND (? IS NULL OR wh.work_date >= ?)
        AND (? IS NULL OR wh.work_date <= ?)
      LEFT JOIN salary_advances sa ON e.id = sa.employee_id
        AND (? IS NULL OR sa.request_date >= ?)
        AND (? IS NULL OR sa.request_date <= ?)
      LEFT JOIN (
        SELECT
          employee_id,
          basic_salary,
          deductions,
          net_salary,
          ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY created_at DESC) as rn
        FROM employee_payrolls
        WHERE (? IS NULL OR created_at >= ?)
          AND (? IS NULL OR created_at <= ?)
      ) p ON e.id = p.employee_id AND p.rn = 1
      WHERE e.employment_type = 'permanent'
    `;

    const params = [];
    const dateParams = [
      filters.startDate, filters.startDate,
      filters.endDate, filters.endDate,
      filters.startDate, filters.startDate,
      filters.endDate, filters.endDate,
      filters.startDate, filters.startDate,
      filters.endDate, filters.endDate
    ];

    if (filters.employeeId) {
      query += ' AND e.id = ?';
      params.push(...dateParams, filters.employeeId);
    } else {
      params.push(...dateParams);
    }

    query += ' GROUP BY e.id';

    const [employees] = await pool.query(query, params);

    // Get recent activity for each employee
    const employeesWithActivity = await Promise.all(employees.map(async (employee) => {
      // Get recent salary advances
      const [advances] = await pool.query(`
        SELECT
          'Salary Advance' as type,
          amount,
          request_date as date,
          approval_status,
          CONCAT('Requested salary advance of ', amount) as description
        FROM salary_advances
        WHERE employee_id = ?
          AND (? IS NULL OR request_date >= ?)
          AND (? IS NULL OR request_date <= ?)
        ORDER BY request_date DESC
        LIMIT 3
      `, [employee.id, filters.startDate, filters.startDate, filters.endDate, filters.endDate]);

      // Get recent payrolls
      const [payrolls] = await pool.query(`
        SELECT
          'Payroll' as type,
          net_salary as amount,
          created_at as date,
          'completed' as approval_status,
          CONCAT('Received salary of ', net_salary, ' for ',
                 MONTHNAME(STR_TO_DATE(month, '%m')), ' ', year) as description
        FROM employee_payrolls
        WHERE employee_id = ?
          AND (? IS NULL OR created_at >= ?)
          AND (? IS NULL OR created_at <= ?)
        ORDER BY created_at DESC
        LIMIT 3
      `, [employee.id, filters.startDate, filters.startDate, filters.endDate, filters.endDate]);

      // Combine and sort activities
      const recentActivity = [...advances, ...payrolls]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

      return {
        ...employee,
        summary: {
          totalHours: parseFloat(employee.total_hours) || 0,
          totalAdvances: parseFloat(employee.total_advances) || 0,
          advanceCount: parseInt(employee.advance_count) || 0,
          netSalary: parseFloat(employee.net_salary) || parseFloat(employee.basic_salary) || 0
        },
        recentActivity
      };
    }));

    res.json(employeesWithActivity);
  } catch (error) {
    console.error('Error generating employee report:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/payroll/:id', deletePayroll);

router.get('/payroll/:id', protect, getPayrollById);
router.post('/payroll/print', protect, generatePayrollPrint);
router.put('/payroll/:id/approve', [protect, authorize('admin', 'hr')], approvePayroll);

module.exports = router;