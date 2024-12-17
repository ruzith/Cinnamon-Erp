const BaseModel = require('./BaseModel');

class CuttingContractor extends BaseModel {
  constructor() {
    super('cutting_contractors');
  }

  async findByContractorId(contractorId) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM cutting_contractors WHERE contractor_id = ?',
      [contractorId]
    );
    return rows[0];
  }

  async getActiveWithAssignments() {
    const [rows] = await this.pool.execute(`
      SELECT cc.*, 
             COUNT(la.id) as active_assignments,
             GROUP_CONCAT(DISTINCT l.parcel_number) as assigned_lands
      FROM cutting_contractors cc
      LEFT JOIN land_assignments la ON cc.id = la.contractor_id AND la.status = 'active'
      LEFT JOIN lands l ON la.land_id = l.id
      WHERE cc.status = 'active'
      GROUP BY cc.id
      ORDER BY cc.name ASC
    `);
    return rows;
  }
}

module.exports = new CuttingContractor(); 