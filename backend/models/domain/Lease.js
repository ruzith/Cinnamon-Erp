const BaseModel = require('./BaseModel');

class Lease extends BaseModel {
  constructor() {
    super('leases');
  }

  async findByName(name) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM leases WHERE name = ?',
      [name]
    );
    return rows[0];
  }

  async getActiveLeases() {
    const [rows] = await this.pool.execute(`
      SELECT l.*,
             COUNT(w.id) as well_count
      FROM leases l
      LEFT JOIN wells w ON l.id = w.lease_id
      WHERE l.status = 'active'
      GROUP BY l.id
      ORDER BY l.name ASC
    `);
    return rows;
  }
}

module.exports = new Lease(); 