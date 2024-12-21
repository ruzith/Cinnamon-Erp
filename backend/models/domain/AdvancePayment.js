const BaseModel = require('../base/BaseModel');

class AdvancePayment extends BaseModel {
  constructor() {
    super('advance_payments');
  }

  async generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const [result] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM advance_payments WHERE YEAR(created_at) = YEAR(CURRENT_DATE)'
    );
    const count = result[0].count + 1;
    return `ADV${year}${month}${count.toString().padStart(4, '0')}`;
  }

  async getWithDetails(id) {
    const [payment] = await this.pool.execute(`
      SELECT ap.*, mc.name as contractor_name
      FROM advance_payments ap
      JOIN manufacturing_contractors mc ON ap.contractor_id = mc.id
      WHERE ap.id = ?
    `, [id]);
    return payment[0];
  }

  async create(paymentData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      if (!paymentData.receipt_number) {
        paymentData.receipt_number = await this.generateReceiptNumber();
      }

      const [result] = await connection.execute(
        'INSERT INTO advance_payments SET ?',
        {
          ...paymentData,
          created_at: new Date()
        }
      );

      await connection.commit();
      return this.getWithDetails(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new AdvancePayment(); 