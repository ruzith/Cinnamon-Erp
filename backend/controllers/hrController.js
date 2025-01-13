const { pool } = require('../config/db');

const approvePayroll = async (req, res) => {
  try {
    await pool.query('BEGIN');

    const payrollId = req.params.id;
    const userId = req.user.id;

    // Update payroll status to approved
    const updatePayrollQuery = `
      UPDATE employee_payrolls
      SET status = 'approved',
          payment_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP,
          created_by = ?
      WHERE id = ?
    `;

    await pool.query(updatePayrollQuery, [userId, payrollId]);

    // Fetch the updated payroll data
    const [payrollResult] = await pool.query(
      'SELECT * FROM employee_payrolls WHERE id = ?',
      [payrollId]
    );

    if (payrollResult.length === 0) {
      throw new Error('Payroll not found');
    }

    const payroll = payrollResult[0];

    // Update related salary advances to approved (using valid ENUM value)
    const updateAdvancesQuery = `
      UPDATE salary_advances
      SET approval_status = 'approved',
          updated_at = CURRENT_TIMESTAMP,
          approved_by = ?
      WHERE employee_id = ?
      AND MONTH(request_date) = ?
      AND YEAR(request_date) = ?
      AND approval_status = 'pending'
    `;

    await pool.query(updateAdvancesQuery, [
      userId,
      payroll.employee_id,
      payroll.month,
      payroll.year
    ]);

    await pool.query('COMMIT');

    res.json({
      success: true,
      message: 'Payroll approved successfully',
      data: payroll
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error approving payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving payroll',
      error: error.message
    });
  }
};

module.exports = {
  approvePayroll
};