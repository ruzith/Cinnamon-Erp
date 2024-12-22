const BaseModel = require('../base/BaseModel');

class Employee extends BaseModel {
  constructor() {
    super('employees');
  }

  async findByNIC(nic) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM employees WHERE nic = ?',
      [nic]
    );
    return rows[0];
  }

  async getWithDetails() {
    const [rows] = await this.pool.execute(`
      SELECT e.id,
             e.name,
             e.nic,
             e.phone,
             e.address,
             e.birthday,
             e.designation_id,
             e.employment_type,
             e.status,
             e.salary_structure_id,
             e.bank_name,
             e.account_number,
             e.account_name,
             e.created_at,
             e.updated_at,
             d.title as designation_title,
             d.department,
             s.name as salary_structure_name,
             s.basic_salary
      FROM employees e
      LEFT JOIN designations d ON e.designation_id = d.id
      LEFT JOIN salary_structures s ON e.salary_structure_id = s.id
      ORDER BY e.name ASC
    `);
    return rows;
  }

  async getActiveEmployees() {
    const [rows] = await this.pool.execute(`
      SELECT e.id,
             e.name,
             e.nic,
             e.phone,
             e.address,
             e.birthday,
             e.designation_id,
             e.employment_type,
             e.status,
             e.salary_structure_id,
             e.bank_name,
             e.account_number,
             e.account_name,
             e.created_at,
             e.updated_at,
             d.title as designation_title,
             d.department,
             s.name as salary_structure_name,
             s.basic_salary
      FROM employees e
      LEFT JOIN designations d ON e.designation_id = d.id
      LEFT JOIN salary_structures s ON e.salary_structure_id = s.id
      WHERE e.status = 'active'
      ORDER BY e.name ASC
    `);
    return rows;
  }
}

module.exports = Employee; 