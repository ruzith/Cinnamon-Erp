const BaseModel = require('../base/BaseModel');

class Designation extends BaseModel {
  constructor() {
    super('designations');
  }

  async findByTitle(title) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM designations WHERE title = ?',
      [title]
    );
    return rows[0];
  }

  async getWithEmployeeCount() {
    const [rows] = await this.pool.execute(`
      SELECT d.*, COUNT(e.id) as employee_count
      FROM designations d
      LEFT JOIN employees e ON d.id = e.designation_id
      GROUP BY d.id
      ORDER BY d.title ASC
    `);
    return rows;
  }
}

module.exports = new Designation(); 