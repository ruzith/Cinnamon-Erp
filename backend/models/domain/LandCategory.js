const BaseModel = require('../base/BaseModel');

class LandCategory extends BaseModel {
  constructor() {
    super('land_categories');
  }

  async findByName(name) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM land_categories WHERE name = ?',
      [name]
    );
    return rows[0];
  }

  async getActiveCategories() {
    const [rows] = await this.pool.execute(`
      SELECT lc.*,
             COUNT(l.id) as land_count
      FROM land_categories lc
      LEFT JOIN lands l ON lc.id = l.category_id
      WHERE lc.status = 'active'
      GROUP BY lc.id
      ORDER BY lc.name ASC
    `);
    return rows;
  }

  async getAllWithLandCount() {
    const [rows] = await this.pool.execute(`
      SELECT lc.*,
             COUNT(l.id) as land_count
      FROM land_categories lc
      LEFT JOIN lands l ON lc.id = l.category_id
      GROUP BY lc.id
      ORDER BY lc.name ASC
    `);
    return rows;
  }
}

module.exports = new LandCategory();