const BaseModel = require('./BaseModel');

class Grade extends BaseModel {
  constructor() {
    super('grades');
  }

  async findByName(name) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM grades WHERE name = ?',
      [name]
    );
    return rows[0];
  }

  async getActiveGrades() {
    const [rows] = await this.pool.execute(
      'SELECT * FROM grades WHERE status = ? ORDER BY name',
      ['active']
    );
    return rows;
  }
}

module.exports = new Grade(); 