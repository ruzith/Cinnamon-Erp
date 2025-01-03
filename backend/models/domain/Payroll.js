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
    const [result] = await this.pool.execute(
      'INSERT INTO employee_payrolls SET ?',
      payrollData
    );
    return result.insertId;
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
}

module.exports = Payroll;