const BaseModel = require('./BaseModel');

class LoanPayment extends BaseModel {
  constructor() {
    super('loan_payments');
  }

  async generateReference() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const [result] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM loan_payments WHERE YEAR(created_at) = YEAR(CURRENT_DATE)'
    );
    const count = result[0].count + 1;
    return `LP${year}${month}${count.toString().padStart(4, '0')}`;
  }

  async getWithDetails(id) {
    const [payment] = await this.pool.execute(`
      SELECT lp.*,
             u.name as created_by_name,
             l.borrower_name,
             l.loan_number,
             ls.period_number,
             ls.payment_amount as scheduled_amount
      FROM loan_payments lp
      JOIN loans l ON lp.loan_id = l.id
      JOIN loan_schedule ls ON lp.schedule_item_id = ls.id
      LEFT JOIN users u ON lp.created_by = u.id
      WHERE lp.id = ?
    `, [id]);
    return payment[0];
  }

  async create(paymentData) {
    await this.pool.beginTransaction();
    try {
      // Generate reference if not provided
      if (!paymentData.reference) {
        paymentData.reference = await this.generateReference();
      }

      // Get schedule item if not provided
      if (!paymentData.schedule_item_id) {
        const [scheduleItems] = await this.pool.execute(`
          SELECT id FROM loan_schedule 
          WHERE loan_id = ? AND status != 'paid'
          ORDER BY due_date ASC LIMIT 1
        `, [paymentData.loan_id]);
        
        if (scheduleItems.length > 0) {
          paymentData.schedule_item_id = scheduleItems[0].id;
        }
      }

      // Create payment record
      const [result] = await this.pool.execute(
        'INSERT INTO loan_payments SET ?',
        paymentData
      );
      const paymentId = result.insertId;

      // Update schedule item
      await this.pool.execute(`
        UPDATE loan_schedule 
        SET paid_amount = paid_amount + ?,
            status = CASE 
              WHEN paid_amount + ? >= payment_amount THEN 'paid'
              ELSE 'pending'
            END,
            paid_date = CASE 
              WHEN paid_amount + ? >= payment_amount THEN CURRENT_TIMESTAMP
              ELSE paid_date
            END
        WHERE id = ?
      `, [paymentData.amount, paymentData.amount, paymentData.amount, paymentData.schedule_item_id]);

      // Update loan remaining balance and status
      await this.pool.execute(`
        UPDATE loans l
        SET remaining_balance = remaining_balance - ?,
            status = CASE 
              WHEN remaining_balance - ? <= 0 THEN 'completed'
              ELSE status
            END
        WHERE id = ?
      `, [paymentData.amount, paymentData.amount, paymentData.loan_id]);

      await this.pool.commit();
      return this.getWithDetails(paymentId);
    } catch (error) {
      await this.pool.rollback();
      throw error;
    }
  }
}

module.exports = new LoanPayment(); 