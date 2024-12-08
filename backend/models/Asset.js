const BaseModel = require('./BaseModel');

class Asset extends BaseModel {
  constructor() {
    super('assets');
  }

  async findByCode(code) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM assets WHERE code = ?',
      [code]
    );
    return rows[0];
  }

  async findByAssetNumber(assetNumber) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM assets WHERE asset_number = ?',
      [assetNumber]
    );
    return rows[0];
  }

  async getWithDetails(id) {
    const [rows] = await this.pool.execute(`
      SELECT a.*,
             ac.name as category_name,
             u.name as created_by_name,
             w.name as well_name
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.id
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN wells w ON a.assigned_to = w.id
      ${id ? 'WHERE a.id = ?' : ''}
      ORDER BY a.name ASC
    `, id ? [id] : []);
    return id ? rows[0] : rows;
  }

  async getMaintenanceHistory(id) {
    const [rows] = await this.pool.execute(`
      SELECT am.*,
             u.name as created_by_name
      FROM asset_maintenance am
      LEFT JOIN users u ON am.created_by = u.id
      WHERE am.asset_id = ?
      ORDER BY am.maintenance_date DESC
    `, [id]);
    return rows;
  }

  async generateAssetNumber(type) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const [result] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM assets WHERE type = ? AND YEAR(created_at) = YEAR(CURRENT_DATE)',
      [type]
    );
    const count = result[0].count + 1;
    const prefix = type.charAt(0).toUpperCase();
    return `${prefix}${year}${count.toString().padStart(4, '0')}`;
  }
}

module.exports = new Asset(); 