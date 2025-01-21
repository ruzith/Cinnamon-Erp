const { pool } = require('../config/db');
const Account = require('../models/domain/Account');

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

module.exports = {
  approvePayroll
};