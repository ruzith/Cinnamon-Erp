const BaseModel = require('../base/BaseModel');

class Payroll extends BaseModel {
  constructor() {
    super('employee_payrolls');
  }

  async getWithDetails() {
    const [rows] = await this.pool.execute(`
      SELECT p.*,
             e.name as employee_name,
             e.employment_type,
             u.name as created_by_name
      FROM employee_payrolls p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.year DESC, p.month DESC
    `);
    return rows;
  }

  async getByEmployeeId(employeeId) {
    const [rows] = await this.pool.execute(`
      SELECT p.*,
             e.name as employee_name,
             u.name as created_by_name
      FROM employee_payrolls p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.employee_id = ?
      ORDER BY p.year DESC, p.month DESC
    `, [employeeId]);
    return rows;
  }

  async createPayroll(payrollData) {
    try {
      const columns = Object.keys(payrollData);
      const values = Object.values(payrollData);
      const placeholders = Array(values.length).fill('?').join(', ');

      const [result] = await this.pool.execute(
        `INSERT INTO employee_payrolls (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  async updateStatus(id, status, paymentDate = null) {
    const [result] = await this.pool.execute(
      'UPDATE employee_payrolls SET status = ?, payment_date = ? WHERE id = ?',
      [status, paymentDate, id]
    );
    return result.affectedRows > 0;
  }

  async getPayrollReport(filters) {
    let query = `
      SELECT p.*,
             e.name as employee_name,
             e.employment_type
      FROM employee_payrolls p
      JOIN employees e ON p.employee_id = e.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.employeeId) {
      query += ' AND p.employee_id = ?';
      params.push(filters.employeeId);
    }

    if (filters.startDate) {
      query += ' AND p.created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND p.created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY p.year DESC, p.month DESC';

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await this.pool.execute('SELECT * FROM employee_payrolls WHERE id = ?', [id]);
    return rows[0];
  }

  async findByIdAndDelete(id) {
    const [result] = await this.pool.execute('DELETE FROM employee_payrolls WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Payroll;