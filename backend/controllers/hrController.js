const { pool } = require('../config/db');
const Account = require('../models/domain/Account');
const { generatePayrollSlip } = require('../utils/pdfTemplates');

const approvePayroll = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const payrollId = req.params.id;
    const userId = req.user.id;

    // Get payroll details first
    const [payrollResult] = await connection.execute(
      `SELECT ep.*, e.name as employee_name
       FROM employee_payrolls ep
       JOIN employees e ON ep.employee_id = e.id
       WHERE ep.id = ?`,
      [payrollId]
    );

    if (payrollResult.length === 0) {
      throw new Error('Payroll not found');
    }

    const payroll = payrollResult[0];

    // Update payroll status to approved
    await connection.execute(`
      UPDATE employee_payrolls
      SET status = 'approved',
          payment_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          created_by = ?
      WHERE id = ?
    `, [userId, payrollId]);

    // Get the correct account IDs using account codes
    const salaryExpenseAccount = await Account.findByCode('5001');
    const cashAccount = await Account.findByCode('1001');

    if (!salaryExpenseAccount || !cashAccount) {
      throw new Error('Required accounts not found. Please check account codes 5001 and 1001.');
    }

    // Create accounting transaction
    const transactionData = {
      date: new Date(),
      reference: `PAY-${payrollId}`,
      description: `Salary payment for ${payroll.employee_name} - ${payroll.month}/${payroll.year}`,
      type: 'salary',
      category: 'payroll',
      amount: payroll.net_salary,
      status: 'draft',
      created_by: userId,
      employee_id: payroll.employee_id,
      payment_method: 'bank',
      entries: [
        {
          // Debit Salary Expense Account
          account_id: salaryExpenseAccount.id,
          debit: payroll.net_salary,
          credit: 0,
          description: `Salary expense for ${payroll.employee_name}`
        },
        {
          // Credit Cash Account
          account_id: cashAccount.id,
          debit: 0,
          credit: payroll.net_salary,
          description: `Salary payment to ${payroll.employee_name}`
        }
      ]
    };

    // Create the accounting transaction and get its ID
    const transactionId = await Account.createTransaction(transactionData);

    // Post the transaction to update account balances
    await Account.postTransaction(transactionId);

    // Update related salary advances to approved
    await connection.execute(`
      UPDATE salary_advances
      SET approval_status = 'approved',
          updated_at = CURRENT_TIMESTAMP,
          approved_by = ?
      WHERE employee_id = ?
      AND MONTH(request_date) = ?
      AND YEAR(request_date) = ?
      AND approval_status = 'pending'
    `, [
      userId,
      payroll.employee_id,
      payroll.month,
      payroll.year
    ]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Payroll approved and transaction recorded successfully',
      data: payroll
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error approving payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving payroll',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Helper function to get account ID by code
const getAccountIdByCode = async (code) => {
  const [rows] = await pool.execute(
    'SELECT id FROM accounts WHERE code = ? AND status = "active"',
    [code]
  );

  if (rows.length === 0) {
    throw new Error(`Account with code ${code} not found`);
  }

  return rows[0].id;
};

const getPayrollById = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      // Get payroll details
      const [payrollResult] = await connection.execute(`
        SELECT
          ep.*,
          e.name as employee_name,
          e.designation_id,
          d.title as designation,
          d.department
        FROM employee_payrolls ep
        JOIN employees e ON ep.employee_id = e.id
        LEFT JOIN designations d ON e.designation_id = d.id
        WHERE ep.id = ?
      `, [req.params.id]);

      if (!payrollResult[0]) {
        return res.status(404).json({ message: 'Payroll record not found' });
      }

      const payroll = payrollResult[0];

      // Get additional amounts
      const [additionalAmounts] = await connection.execute(`
        SELECT description, amount
        FROM employee_payroll_items
        WHERE payroll_id = ? AND type = 'addition'
      `, [req.params.id]);

      // Get deduction items
      const [deductionItems] = await connection.execute(`
        SELECT description, amount
        FROM employee_payroll_items
        WHERE payroll_id = ? AND type = 'deduction'
      `, [req.params.id]);

      // Calculate total earnings
      const totalEarnings = parseFloat(payroll.basic_salary) +
        additionalAmounts.reduce((sum, item) => sum + parseFloat(item.amount), 0);

      // Format the response
      const formattedPayroll = {
        ...payroll,
        employee_number: payroll.employee_id,
        additional_amounts: additionalAmounts,
        deduction_items: deductionItems,
        total_earnings: totalEarnings,
        date: new Date(payroll.year, payroll.month - 1).toISOString()
      };

      res.json(formattedPayroll);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching payroll details:', error);
    res.status(500).json({ message: 'Error fetching payroll details' });
  }
};

const generatePayrollPrint = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { payroll } = req.body;

    // Get company settings and currency
    const [settingsResult] = await connection.execute(`
      SELECT s.*, c.symbol as currency_symbol
      FROM settings s
      JOIN currencies c ON s.default_currency = c.id
      WHERE c.status = 'active'
      LIMIT 1
    `);
    const settings = settingsResult[0] || {};

    const receiptHtml = await generatePayrollSlip(payroll, settings);
    res.json({ receiptHtml });
  } catch (error) {
    console.error('Error generating payroll slip:', error);
    res.status(500).json({ message: 'Error generating payroll slip' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  approvePayroll,
  getPayrollById,
  generatePayrollPrint
};