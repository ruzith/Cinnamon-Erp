const BaseModel = require('./BaseModel');

class AssetCategory extends BaseModel {
  constructor() {
    super('asset_categories');
  }

  async findByName(name) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM asset_categories WHERE name = ?',
      [name]
    );
    return rows[0];
  }

  async getActiveCategories() {
    const [rows] = await this.pool.execute(`
      SELECT ac.*,
             COUNT(a.id) as asset_count
      FROM asset_categories ac
      LEFT JOIN assets a ON ac.id = a.category_id
      WHERE ac.status = 'active'
      GROUP BY ac.id
      ORDER BY ac.name ASC
    `);
    return rows;
  }

  async getWithAssets(id) {
    const [category] = await this.pool.execute(`
      SELECT * FROM asset_categories WHERE id = ?
    `, [id]);

    if (!category[0]) return null;

    const [assets] = await this.pool.execute(`
      SELECT a.*,
             u.name as created_by_name,
             w.name as well_name
      FROM assets a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN wells w ON a.assigned_to = w.id
      WHERE a.category_id = ?
      ORDER BY a.name ASC
    `, [id]);

    return {
      ...category[0],
      assets
    };
  }

  async calculateDepreciation(id, date = new Date()) {
    const [assets] = await this.pool.execute(`
      SELECT a.*,
             ac.depreciation_rate,
             ac.useful_life,
             TIMESTAMPDIFF(YEAR, a.purchase_date, ?) as age
      FROM assets a
      JOIN asset_categories ac ON a.category_id = ac.id
      WHERE ac.id = ? AND a.status = 'active'
    `, [date, id]);

    return assets.map(asset => {
      const age = asset.age;
      const depreciationRate = asset.depreciation_rate / 100;
      const usefulLife = asset.useful_life;
      
      // Calculate depreciation using straight-line method
      const annualDepreciation = asset.purchase_price * depreciationRate;
      const totalDepreciation = Math.min(age * annualDepreciation, asset.purchase_price);
      const currentValue = asset.purchase_price - totalDepreciation;

      return {
        asset_id: asset.id,
        asset_name: asset.name,
        purchase_price: asset.purchase_price,
        age,
        depreciation_rate: asset.depreciation_rate,
        annual_depreciation: annualDepreciation,
        total_depreciation: totalDepreciation,
        current_value: currentValue
      };
    });
  }
}

module.exports = new AssetCategory(); 