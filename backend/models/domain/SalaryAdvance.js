const BaseModel = require('../base/BaseModel');

class SalaryAdvance extends BaseModel {
  constructor() {
    super('salary_advances');
  }

  async getWithDetails() {
    const [rows] = await this.pool.execute(`
      SELECT sa.*,
             e.name as employee_name,
             e.employment_type,
             u.name as approver_name
      FROM salary_advances sa
      JOIN employees e ON sa.employee_id = e.id
      LEFT JOIN users u ON sa.approved_by = u.id
      ORDER BY sa.request_date DESC
    `);
    return rows;
  }

  async getByEmployeeId(employeeId) {
    const [rows] = await this.pool.execute(`
      SELECT sa.*,
             e.name as employee_name,
             u.name as approver_name
      FROM salary_advances sa
      JOIN employees e ON sa.employee_id = e.id
      LEFT JOIN users u ON sa.approved_by = u.id
      WHERE sa.employee_id = ?
      ORDER BY sa.request_date DESC
    `, [employeeId]);
    return rows;
  }

  async getPendingAdvances() {
    const [rows] = await this.pool.execute(`
      SELECT sa.*,
             e.name as employee_name,
             e.employment_type
      FROM salary_advances sa
      JOIN employees e ON sa.employee_id = e.id
      WHERE sa.approval_status = 'pending'
      ORDER BY sa.request_date ASC
    `);
    return rows;
  }

  async approve(id, approvedBy) {
    const [result] = await this.pool.execute(
      'UPDATE salary_advances SET approval_status = ?, approved_by = ? WHERE id = ?',
      ['approved', approvedBy, id]
    );
    return result.affectedRows > 0;
  }

  async reject(id, approvedBy) {
    const [result] = await this.pool.execute(
      'UPDATE salary_advances SET approval_status = ?, approved_by = ? WHERE id = ?',
      ['rejected', approvedBy, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = SalaryAdvance;