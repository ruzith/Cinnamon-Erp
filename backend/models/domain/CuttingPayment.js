const BaseModel = require('../base/BaseModel');

class CuttingPayment extends BaseModel {
  constructor() {
    super('cutting_payments');
  }

  async create(paymentData) {
    try {
      // Generate receipt number
      const date = new Date(paymentData.payment_date);
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const [countResult] = await this.pool.execute('SELECT COUNT(*) as count FROM cutting_payments');
      const count = countResult[0].count + 1;
      const receipt_number = `CUT${year}${month}${count.toString().padStart(4, '0')}`;

      // Insert payment record
      const [result] = await this.pool.execute(
        `INSERT INTO cutting_payments 
         (contractor_id, assignment_id, total_amount, company_contribution, manufacturing_contribution, 
          status, payment_date, receipt_number, notes, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentData.contractor_id,
          paymentData.assignment_id,
          paymentData.total_amount,
          paymentData.company_contribution,
          paymentData.manufacturing_contribution,
          paymentData.status,
          paymentData.payment_date,
          receipt_number,
          paymentData.notes,
          paymentData.created_by
        ]
      );

      // Return the created payment with details
      return this.getWithDetails(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  async getWithDetails(id) {
    const [payment] = await this.pool.execute(`
      SELECT cp.*,
             cc.name as contractor_name,
             l.parcel_number,
             l.location,
             u.name as created_by_name
      FROM cutting_payments cp
      LEFT JOIN cutting_contractors cc ON cp.contractor_id = cc.id
      LEFT JOIN land_assignments la ON cp.assignment_id = la.id
      LEFT JOIN lands l ON la.land_id = l.id
      LEFT JOIN users u ON cp.created_by = u.id
      WHERE cp.id = ?
    `, [id]);

    return payment[0] || null;
  }

  async findByContractor(contractorId) {
    const [rows] = await this.pool.execute(`
      SELECT cp.*,
             cc.name as contractor_name,
             l.parcel_number,
             l.location,
             u.name as created_by_name
      FROM cutting_payments cp
      LEFT JOIN cutting_contractors cc ON cp.contractor_id = cc.id
      LEFT JOIN land_assignments la ON cp.assignment_id = la.id
      LEFT JOIN lands l ON la.land_id = l.id
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