const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');
const AssetMaintenance = require('../models/AssetMaintenance');

// Category routes
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await AssetCategory.getActiveCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/categories', protect, authorize('admin'), async (req, res) => {
  try {
    const [result] = await AssetCategory.pool.execute(
      'INSERT INTO asset_categories SET ?',
      [req.body]
    );
    const category = await AssetCategory.getWithAssets(result.insertId);
    res.status(201).json(category);
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
    const assetData = {
      ...req.body,
      created_by: req.user.id
    };
    
    const [result] = await Asset.pool.execute(
      'INSERT INTO assets SET ?',
      [assetData]
    );
    
    const asset = await Asset.getWithDetails(result.insertId);
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
      asset_id: req.params.assetId,
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

module.exports = router; 