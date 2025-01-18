const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Asset = require('../models/domain/Asset');
const AssetCategory = require('../models/domain/AssetCategory');
const AssetMaintenance = require('../models/domain/AssetMaintenance');
const { getAssets, deleteAsset } = require('../controllers/assetController');
const { authenticateToken } = require('../middleware/auth');
const { validateAssetData } = require('../validators/assetValidator');

// Category routes
router.get('/categories', protect, async (req, res) => {
  try {
    const [rows] = await Asset.pool.execute(`
      SELECT DISTINCT category as name,
             COUNT(*) as asset_count
      FROM assets
      GROUP BY category
      ORDER BY category ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/categories', protect, authorize('admin'), async (req, res) => {
  try {
    // Instead of creating a category, just return success
    // Categories are now just strings in the assets table
    res.status(201).json({
      message: 'Categories are now managed directly through assets',
      category: req.body.name
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Asset routes
router.get('/', protect, async (req, res) => {
  try {
    const assets = await Asset.getWithDetails();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    // Validate required fields
    const { isValid, errors } = validateAssetData(req.body);
    if (!isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors
      });
    }

    // Transform and sanitize the data
    const assetData = {
      asset_number: req.body.assetNumber || await Asset.generateAssetNumber(req.body.type),
      name: req.body.name.trim(),
      category: req.body.category?.trim() || 'Uncategorized',
      type: req.body.type?.trim() || 'General',
      purchase_date: new Date(req.body.purchaseDate),
      purchase_price: parseFloat(req.body.purchasePrice) || 0,
      current_value: parseFloat(req.body.currentValue) || parseFloat(req.body.purchasePrice) || 0,
      status: req.body.status || 'active',
      created_by: req.user.id
    };

    // Generate code if not provided
    assetData.code = req.body.code || await Asset.generateAssetNumber(req.body.type);

    const [result] = await Asset.pool.execute(`
      INSERT INTO assets (
        code,
        asset_number,
        name,
        category,
        type,
        purchase_date,
        purchase_price,
        current_value,
        status,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      assetData.code,
      assetData.asset_number,
      assetData.name,
      assetData.category,
      assetData.type,
      assetData.purchase_date,
      assetData.purchase_price,
      assetData.current_value,
      assetData.status,
      assetData.created_by
    ]);

    const asset = await Asset.getWithDetails(result.insertId);
    res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(400).json({
      message: error.message || 'Error creating asset',
      details: error.sqlMessage
    });
  }
});

// Update asset
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Validate the update data
    const { isValid, errors } = validateAssetData(req.body);
    if (!isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors
      });
    }

    // Transform and sanitize the data
    const assetData = {
      asset_number: req.body.assetNumber?.trim() || asset.asset_number,
      name: req.body.name?.trim() || asset.name,
      category: req.body.category?.trim() || 'Uncategorized',
      type: req.body.type?.trim() || 'General',
      purchase_date: new Date(req.body.purchaseDate),
      purchase_price: parseFloat(req.body.purchasePrice) || 0,
      current_value: parseFloat(req.body.currentValue) || parseFloat(req.body.purchasePrice) || 0,
      status: req.body.status || 'active'
    };

    const [result] = await Asset.pool.execute(`
      UPDATE assets
      SET asset_number = ?,
          name = ?,
          category = ?,
          type = ?,
          purchase_date = ?,
          purchase_price = ?,
          current_value = ?,
          status = ?
      WHERE id = ?
    `, [
      assetData.asset_number,
      assetData.name,
      assetData.category,
      assetData.type,
      assetData.purchase_date,
      assetData.purchase_price,
      assetData.current_value,
      assetData.status,
      req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const updatedAsset = await Asset.getWithDetails(req.params.id);
    res.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(400).json({
      message: error.message || 'Error updating asset',
      details: error.sqlMessage
    });
  }
});

// Maintenance routes
router.post('/:assetId/maintenance', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const maintenanceData = {
      ...req.body,
      created_by: req.user.id
    };

    const maintenance = await AssetMaintenance.createWithAttachments(maintenanceData);
    res.status(201).json(maintenance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get asset maintenance records
router.get('/:assetId/maintenance', protect, async (req, res) => {
  try {
    const maintenance = await AssetMaintenance.getByAssetId(req.params.assetId);
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all maintenance records
router.get('/maintenance', protect, async (req, res) => {
  try {
    const [rows] = await AssetMaintenance.pool.execute(`
      SELECT am.*,
             u.name as created_by_name,
             a.name as asset_name,
             a.code as asset_code
      FROM asset_maintenance am
      JOIN assets a ON am.asset_id = a.id
      LEFT JOIN users u ON am.created_by = u.id
      ORDER BY am.maintenance_date DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate depreciation report
router.get('/report/depreciation', protect, async (req, res) => {
  try {
    const [assets] = await Asset.pool.execute(`
      SELECT a.*,
             ac.name as category_name,
             ac.depreciation_rate
      FROM assets a
      JOIN asset_categories ac ON a.category_id = ac.id
      WHERE a.status = 'active'
    `);

    const report = assets.map(asset => {
      const purchaseDate = new Date(asset.purchase_date);
      const currentDate = new Date();
      const ageInYears = (currentDate - purchaseDate) / (365 * 24 * 60 * 60 * 1000);
      const currentValue = asset.purchase_price * Math.pow(1 - (asset.depreciation_rate / 100), ageInYears);

      return {
        name: asset.name,
        code: asset.code,
        purchasePrice: asset.purchase_price,
        purchaseDate: asset.purchase_date,
        currentValue: Math.max(currentValue, 0),
        depreciation: asset.purchase_price - Math.max(currentValue, 0),
        depreciationRate: asset.depreciation_rate
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get depreciation report for an asset
router.get('/:id/depreciation', protect, async (req, res) => {
  try {
    const depreciation = await Asset.calculateDepreciation(req.params.id);
    if (!depreciation) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json(depreciation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get asset value report
router.get('/report/values', protect, async (req, res) => {
  try {
    const [rows] = await Asset.pool.execute(`
      SELECT
        ac.name as category_name,
        COUNT(*) as asset_count,
        SUM(a.purchase_price) as total_purchase_value,
        SUM(a.current_value) as total_current_value,
        SUM(a.purchase_price - a.current_value) as total_depreciation
      FROM assets a
      JOIN asset_categories ac ON a.category_id = ac.id
      WHERE a.status != 'retired'
      GROUP BY ac.id, ac.name
      ORDER BY ac.name
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get asset usage report
router.get('/report/usage', protect, async (req, res) => {
  try {
    const [rows] = await Asset.pool.execute(`
      SELECT
        a.*,
        ac.name as category_name,
        COUNT(am.id) as maintenance_count,
        MAX(am.maintenance_date) as last_maintenance
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.id
      LEFT JOIN asset_maintenance am ON a.id = am.asset_id
      GROUP BY a.id
      ORDER BY a.name
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an asset
router.delete('/:id', protect, authorize('admin'), deleteAsset);

module.exports = router;