const BaseModel = require('./BaseModel');

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
      SELECT e.*, 
             d.title as designation_title,
             d.department as designation_department,
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

module.exports = new Employee(); 