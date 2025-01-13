const BaseModel = require('../base/BaseModel');
const { pool } = require('../../config/db');

class LoanPayment extends BaseModel {
  constructor() {
    super('loan_payments');
  }

  async generateReference() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM loan_payments WHERE YEAR(created_at) = YEAR(CURRENT_DATE)'
    );
    const count = result[0].count + 1;
    return `LP${year}${month}${count.toString().padStart(4, '0')}`;
  }

  async getWithDetails(id) {
    const [payment] = await pool.execute(`
      SELECT lp.*,
             u.name as created_by_name,
             l.loan_number,
             l.borrower_type,
             CASE
               WHEN l.borrower_type = 'employee' THEN e.name
               WHEN l.borrower_type = 'contractor' THEN COALESCE(mc.name, cc.name)
             END as borrower_name,
             ls.period_number,
             ls.payment_amount as scheduled_amount
      FROM loan_payments lp
      JOIN loans l ON lp.loan_id = l.id
      LEFT JOIN users u ON lp.created_by = u.id
      LEFT JOIN loan_schedule ls ON lp.schedule_item_id = ls.id
      LEFT JOIN employees e ON l.borrower_type = 'employee' AND l.borrower_id = e.id
      LEFT JOIN manufacturing_contractors mc ON l.borrower_type = 'contractor' AND l.borrower_id = mc.id
      LEFT JOIN cutting_contractors cc ON l.borrower_type = 'contractor' AND l.borrower_id = cc.id
      WHERE lp.id = ?
    `, [id]);
    return payment[0];
  }

  async create(paymentData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Generate reference if not provided
      if (!paymentData.reference) {
        paymentData.reference = await this.generateReference();
      }

      // Get schedule item if not provided
      if (!paymentData.schedule_item_id) {
        const [scheduleItems] = await connection.execute(`
          SELECT id FROM loan_schedule
          WHERE loan_id = ? AND status != 'paid'
          ORDER BY due_date ASC LIMIT 1
        `, [paymentData.loan_id]);

        if (scheduleItems.length > 0) {
          paymentData.schedule_item_id = scheduleItems[0].id;
        }
      }

      // Create payment record - using proper field names and values
      const fields = Object.keys(paymentData).join(', ');
      const placeholders = Object.keys(paymentData).map(() => '?').join(', ');
      const values = Object.values(paymentData);

      const [result] = await connection.execute(
        `INSERT INTO loan_payments (${fields}) VALUES (${placeholders})`,
        values
      );
      const paymentId = result.insertId;

      // Update schedule item if it exists
      if (paymentData.schedule_item_id) {
        await connection.execute(`
          UPDATE loan_schedule
          SET paid_amount = paid_amount + ?,
              status = CASE
                WHEN paid_amount + ? >= payment_amount THEN 'paid'
                ELSE 'partial'
              END
          WHERE id = ?
        `, [paymentData.amount, paymentData.amount, paymentData.schedule_item_id]);
      }

      // Update loan remaining balance and status
      await connection.execute(`
        UPDATE loans l
        SET remaining_balance = remaining_balance - ?,
            status = CASE
              WHEN remaining_balance - ? = 0 THEN 'completed'
              ELSE status
            END
        WHERE id = ?
      `, [paymentData.amount, paymentData.amount, paymentData.loan_id]);

      await connection.commit();
      connection.release();
      return this.getWithDetails(paymentId);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }
}

module.exports = new LoanPayment();