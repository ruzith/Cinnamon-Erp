const BaseModel = require('../base/BaseModel');

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
             u.name as created_by_name
      FROM assets a
      LEFT JOIN users u ON a.created_by = u.id
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
      'SELECT COUNT(*) as count FROM assets WHERE YEAR(created_at) = YEAR(CURRENT_DATE)',
      []
    );
    const count = result[0].count + 1;
    const prefix = (type?.charAt(0) || 'A').toUpperCase();
    return `${prefix}${year}${count.toString().padStart(4, '0')}`;
  }

  async calculateDepreciation(id) {
    const [asset] = await this.pool.execute(`
      SELECT a.*,
             TIMESTAMPDIFF(YEAR, a.purchase_date, CURRENT_DATE) as age
      FROM assets a
      WHERE a.id = ?
    `, [id]);

    if (!asset[0]) return null;

    const {
      purchase_price,
      age,
    } = asset[0];

    // Use default depreciation rate and useful life since we no longer have categories
    const depreciation_rate = 10; // Default 10%
    const useful_life = 5; // Default 5 years

    // Calculate straight-line depreciation
    const annualDepreciation = purchase_price * (depreciation_rate / 100);
    const totalDepreciation = Math.min(age * annualDepreciation, purchase_price);
    const currentValue = purchase_price - totalDepreciation;

    // Update current value in database
    await this.pool.execute(
      'UPDATE assets SET current_value = ? WHERE id = ?',
      [currentValue, id]
    );

    return {
      purchase_price,
      current_value: currentValue,
      total_depreciation: totalDepreciation,
      annual_depreciation: annualDepreciation,
      age,
      useful_life_remaining: Math.max(useful_life - age, 0)
    };
  }
}

module.exports = new Asset();