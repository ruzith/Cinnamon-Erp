const Payroll = require('../models/domain/Payroll'); // Correct path to Payroll model
const { pool } = require('../config/db');

// existing functions...

// Function to delete a payroll record
const deletePayroll = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // First update salary advances to remove payroll_id reference
        await connection.execute(
            `UPDATE salary_advances
             SET payroll_id = NULL,
                 status = 'approved',
                 payment_date = NULL
             WHERE payroll_id = ?`,
            [id]
        );

        // Then delete all payroll items
        await connection.execute(
            'DELETE FROM employee_payroll_items WHERE payroll_id = ?',
            [id]
        );

        // Finally delete the payroll record
        await connection.execute(
            'DELETE FROM employee_payrolls WHERE id = ?',
            [id]
        );

        await connection.commit();
        res.status(200).json({ message: 'Payroll record deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting payroll:', error);
        res.status(500).json({ message: 'Error deleting payroll', error: error.message });
    } finally {
        connection.release();
    }
};

// existing functions...

module.exports = {
    // existing exports...
    deletePayroll,
};