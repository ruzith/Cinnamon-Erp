const BaseModel = require('./BaseModel');

class Well extends BaseModel {
  constructor() {
    super('wells');
  }

  async findByName(name) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM wells WHERE name = ?',
      [name]
    );
    return rows[0];
  }

  async getWithDetails(id) {
    const [rows] = await this.pool.execute(`
      SELECT w.*,
             l.name as lease_name,
             JSON_OBJECT(
               'latitude', w.latitude,
               'longitude', w.longitude
             ) as location,
             JSON_OBJECT(
               'oil', w.oil_production,
               'gas', w.gas_production,
               'water', w.water_production
             ) as production
      FROM wells w
      LEFT JOIN leases l ON w.lease_id = l.id
      ${id ? 'WHERE w.id = ?' : ''}
      ORDER BY w.name ASC
    `, id ? [id] : []);
    
    return id ? rows[0] : rows;
  }
}

module.exports = new Well(); 