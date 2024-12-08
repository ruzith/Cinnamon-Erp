const BaseModel = require('./BaseModel');

class AssetMaintenance extends BaseModel {
  constructor() {
    super('asset_maintenance');
  }

  async getByAssetId(assetId) {
    const [rows] = await this.pool.execute(`
      SELECT am.*,
             u.name as created_by_name,
             a.name as asset_name,
             a.code as asset_code
      FROM asset_maintenance am
      JOIN assets a ON am.asset_id = a.id
      LEFT JOIN users u ON am.created_by = u.id
      WHERE am.asset_id = ?
      ORDER BY am.maintenance_date DESC
    `, [assetId]);
    return rows;
  }

  async getWithDetails(id) {
    const [maintenance] = await this.pool.execute(`
      SELECT am.*,
             u.name as created_by_name,
             a.name as asset_name,
             a.code as asset_code
      FROM asset_maintenance am
      JOIN assets a ON am.asset_id = a.id
      LEFT JOIN users u ON am.created_by = u.id
      WHERE am.id = ?
    `, [id]);

    if (!maintenance[0]) return null;

    const [attachments] = await this.pool.execute(`
      SELECT * FROM asset_attachments
      WHERE maintenance_id = ?
      ORDER BY created_at DESC
    `, [id]);

    return {
      ...maintenance[0],
      attachments
    };
  }

  async createWithAttachments(maintenanceData, attachments = []) {
    await this.pool.beginTransaction();
    try {
      // Create maintenance record
      const [result] = await this.pool.execute(
        'INSERT INTO asset_maintenance SET ?',
        maintenanceData
      );
      const maintenanceId = result.insertId;

      // Create attachments if any
      for (const attachment of attachments) {
        await this.pool.execute(
          'INSERT INTO asset_attachments SET ?',
          { ...attachment, maintenance_id: maintenanceId }
        );
      }

      // Update asset status if maintenance
      if (maintenanceData.type === 'repair') {
        await this.pool.execute(
          'UPDATE assets SET status = "maintenance" WHERE id = ?',
          [maintenanceData.asset_id]
        );
      }

      await this.pool.commit();
      return this.getWithDetails(maintenanceId);
    } catch (error) {
      await this.pool.rollback();
      throw error;
    }
  }

  async addAttachment(maintenanceId, attachment) {
    const [result] = await this.pool.execute(
      'INSERT INTO asset_attachments SET ?',
      { ...attachment, maintenance_id: maintenanceId }
    );
    return result.insertId;
  }

  async getUpcomingMaintenance(days = 30) {
    const [rows] = await this.pool.execute(`
      SELECT am.*,
             a.name as asset_name,
             a.code as asset_code
      FROM asset_maintenance am
      JOIN assets a ON am.asset_id = a.id
      WHERE am.next_maintenance_date IS NOT NULL
      AND am.next_maintenance_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL ? DAY)
      ORDER BY am.next_maintenance_date ASC
    `, [days]);
    return rows;
  }
}

module.exports = new AssetMaintenance(); 