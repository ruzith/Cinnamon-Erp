const BaseModel = require('../base/BaseModel');

class ManufacturingContractor extends BaseModel {
  constructor() {
    super('manufacturing_contractors');
  }

  async findByContractorId(contractorId) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM manufacturing_contractors WHERE contractor_id = ?',
      [contractorId]
    );
    return rows[0];
  }

  async getActiveWithAssignments() {
    const [rows] = await this.pool.execute(`
      SELECT mc.*, 
             COUNT(ca.id) as active_assignments,
             SUM(CASE WHEN ca.status = 'active' THEN ca.quantity ELSE 0 END) as total_assigned_quantity
      FROM manufacturing_contractors mc
      LEFT JOIN cinnamon_assignments ca ON mc.id = ca.contractor_id AND ca.status = 'active'
      WHERE mc.status = 'active'
      GROUP BY mc.id
      ORDER BY mc.name ASC
    `);
    return rows;
  }
}

module.exports = new ManufacturingContractor(); 