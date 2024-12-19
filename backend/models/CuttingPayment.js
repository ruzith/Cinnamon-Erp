const BaseModel = require('./BaseModel');

class CuttingPayment extends BaseModel {
  constructor() {
    super('cutting_payments');
  }

  async generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const [result] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM cutting_payments WHERE YEAR(created_at) = YEAR(CURRENT_DATE)'
    );
    const count = result[0].count + 1;
    
    return `CUT${year}${month}${count.toString().padStart(4, '0')}`;
  }

  async create(paymentData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Generate receipt number if not provided
      if (!paymentData.receipt_number) {
        paymentData.receipt_number = await this.generateReceiptNumber();
      }

      // Create payment record
      const [result] = await connection.execute(
        'INSERT INTO cutting_payments SET ?',
        {
          ...paymentData,
          created_at: new Date(),
          total_amount: paymentData.total_amount || 250, // Default cutting fee
          company_contribution: paymentData.company_contribution || 100,
          manufacturing_contribution: paymentData.manufacturing_contribution || 150
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

  async getWithDetails(id) {
    const [payment] = await this.pool.execute(`
      SELECT cp.*,
             cc.name as contractor_name,
             la.assignment_number,
             u.name as created_by_name
      FROM cutting_payments cp
      LEFT JOIN cutting_contractors cc ON cp.contractor_id = cc.id
      LEFT JOIN land_assignments la ON cp.assignment_id = la.id
      LEFT JOIN users u ON cp.created_by = u.id
      WHERE cp.id = ?
    `, [id]);

    return payment[0] || null;
  }

  async findByContractor(contractorId) {
    const [rows] = await this.pool.execute(`
      SELECT cp.*,
             cc.name as contractor_name,
             la.assignment_number,
             u.name as created_by_name
      FROM cutting_payments cp
      LEFT JOIN cutting_contractors cc ON cp.contractor_id = cc.id
      LEFT JOIN land_assignments la ON cp.assignment_id = la.id
      LEFT JOIN users u ON cp.created_by = u.id
      WHERE cp.contractor_id = ?
      ORDER BY cp.payment_date DESC
    `, [contractorId]);

    return rows;
  }

  async updateStatus(id, status) {
    await this.pool.execute(
      'UPDATE cutting_payments SET status = ? WHERE id = ?',
      [status, id]
    );
    return this.getWithDetails(id);
  }
}

module.exports = new CuttingPayment(); 