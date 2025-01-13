const { pool } = require('../config/db');
const { validateAssetId } = require('../validators/assetValidator');

/**
 * Get all assets
 * @route   GET /api/assets
 * @access  Private
 */
const getAssets = async (req, res) => {
  try {
    const assets = await Asset.getWithDetails();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete an asset and its related maintenance records
 * @route   DELETE /api/assets/:id
 * @access  Private
 */
const deleteAsset = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate asset ID
    if (!validateAssetId(id)) {
      return res.status(400).json({ error: 'Invalid asset ID' });
    }

    // Start a transaction since we're deleting from multiple tables
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // First check if asset exists
      const [asset] = await connection.query(
        'SELECT * FROM assets WHERE id = ?',
        [id]
      );

      if (!asset || asset.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Asset not found' });
      }

      // First delete attachments for all maintenance records of this asset
      await connection.query(`
        DELETE FROM asset_attachments
        WHERE maintenance_id IN (
          SELECT id FROM asset_maintenance
          WHERE asset_id = ?
        )`,
        [id]
      );

      // Then delete maintenance records
      await connection.query(
        'DELETE FROM asset_maintenance WHERE asset_id = ?',
        [id]
      );

      // Finally delete the asset
      const [result] = await connection.query(
        'DELETE FROM assets WHERE id = ?',
        [id]
      );

      await connection.commit();
      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      res.status(200).json({ message: 'Asset deleted successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAssets,
  deleteAsset
};