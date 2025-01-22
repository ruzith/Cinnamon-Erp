const BaseModel = require('../base/BaseModel');

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
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      // Transform and sanitize the data
      const dbMaintenanceData = {
        asset_id: maintenanceData.asset_id,
        type: maintenanceData.type || 'routine',
        description: maintenanceData.description || '',
        maintenance_date: maintenanceData.maintenance_date || new Date().toISOString().split('T')[0],
        cost: parseFloat(maintenanceData.cost) || 0,
        performed_by: maintenanceData.performed_by || '',
        next_maintenance_date: maintenanceData.next_maintenance_date || null,
        status: maintenanceData.status || 'pending',
        notes: maintenanceData.notes || '',
        created_by: maintenanceData.created_by
      };

      // Create maintenance record with explicit column names
      const [result] = await connection.execute(`
        INSERT INTO asset_maintenance (
          asset_id,
          type,
          description,
          maintenance_date,
          cost,
          performed_by,
          next_maintenance_date,
          status,
          notes,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        dbMaintenanceData.asset_id,
        dbMaintenanceData.type,
        dbMaintenanceData.description,
        dbMaintenanceData.maintenance_date,
        dbMaintenanceData.cost,
        dbMaintenanceData.performed_by,
        dbMaintenanceData.next_maintenance_date,
        dbMaintenanceData.status,
        dbMaintenanceData.notes,
        dbMaintenanceData.created_by
      ]);

      const maintenanceId = result.insertId;

      // Create attachments if any
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          await connection.execute(
            'INSERT INTO asset_attachments (maintenance_id, name, url) VALUES (?, ?, ?)',
            [maintenanceId, attachment.name, attachment.url]
          );
        }
      }

      await connection.commit();
      return this.getWithDetails(maintenanceId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
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