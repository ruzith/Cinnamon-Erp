const BaseModel = require('./BaseModel');

class LandAssignment extends BaseModel {
  constructor() {
    super('land_assignments');
  }

  async getWithDetails(id) {
    const [rows] = await this.pool.execute(`
      SELECT la.*,
             cc.name as contractor_name,
             l.land_number,
             l.name as land_name,
             u.name as created_by_name
      FROM land_assignments la
      JOIN cutting_contractors cc ON la.contractor_id = cc.id
      JOIN lands l ON la.land_id = l.id
      LEFT JOIN users u ON la.created_by = u.id
      ${id ? 'WHERE la.id = ?' : ''}
      ORDER BY la.created_at DESC
    `, id ? [id] : []);

    return id ? rows[0] : rows;
  }

  async getActiveAssignments() {
    const [rows] = await this.pool.execute(`
      SELECT la.*,
             cc.name as contractor_name,
             l.land_number,
             l.name as land_name
      FROM land_assignments la
      JOIN cutting_contractors cc ON la.contractor_id = cc.id
      JOIN lands l ON la.land_id = l.id
      WHERE la.status = 'active'
      ORDER BY la.created_at DESC
    `);
    return rows;
  }
}

module.exports = new LandAssignment();