const BaseModel = require('../base/BaseModel');

class SalaryStructure extends BaseModel {
  constructor() {
    super('salary_structures');
  }

  async find(conditions = {}) {
    try {
      let query = 'SELECT * FROM salary_structures WHERE 1=1';
      const values = [];

      if (conditions.status) {
        query += ' AND status = ?';
        values.push(conditions.status);
      }

      const [rows] = await this.pool.execute(query, values);
      return rows;
    } catch (error) {
      console.error('Error in SalaryStructure.find:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM salary_structures WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in SalaryStructure.findById:', error);
      throw error;
    }
  }
}

module.exports = new SalaryStructure();