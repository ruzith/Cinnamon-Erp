const BaseModel = require('./BaseModel');

class Category extends BaseModel {
  constructor() {
    super('categories');
  }

  async findByName(name) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM categories WHERE name = ?',
      [name]
    );
    return rows[0];
  }

  async getActiveCategories(type = null) {
    let query = 'SELECT * FROM categories WHERE status = ?';
    const params = ['active'];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY name';

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }
}

module.exports = new Category(); 