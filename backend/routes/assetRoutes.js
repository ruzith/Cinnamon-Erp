const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');
const AssetMaintenance = require('../models/AssetMaintenance');

// Category routes
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await AssetCategory.find({ status: 'active' });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/categories', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await AssetCategory.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Asset routes
router.get('/', protect, async (req, res) => {
  try {
    const assets = await Asset.find()
      .populate('category')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const asset = new Asset({
      ...req.body,
      createdBy: req.user.id
    });
    await asset.calculateCurrentValue();
    await asset.save();
    
    res.status(201).json(
      await asset
        .populate('category')
        .populate('createdBy', 'name')
    );
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

    const maintenance = await AssetMaintenance.create({
      ...req.body,
      asset: req.params.assetId,
      createdBy: req.user.id
    });

    // Update asset's maintenance schedule
    asset.maintenanceSchedule.lastMaintenance = maintenance.maintenanceDate;
    asset.maintenanceSchedule.nextMaintenance = maintenance.nextMaintenanceDate;
    await asset.save();

    res.status(201).json(await maintenance.populate(['asset', 'createdBy']));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get asset maintenance records
router.get('/:assetId/maintenance', protect, async (req, res) => {
  try {
    const maintenance = await AssetMaintenance.find({ asset: req.params.assetId })
      .populate('asset')
      .populate('createdBy', 'name')
      .sort('-maintenanceDate');
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all maintenance records
router.get('/maintenance', protect, async (req, res) => {
  try {
    const maintenance = await AssetMaintenance.find()
      .populate('asset')
      .populate('createdBy', 'name')
      .sort('-maintenanceDate');
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate depreciation report
router.get('/report/depreciation', protect, async (req, res) => {
  try {
    const assets = await Asset.find().populate('category');
    const report = assets.map(asset => ({
      name: asset.name,
      code: asset.code,
      purchasePrice: asset.purchasePrice,
      purchaseDate: asset.purchaseDate,
      currentValue: asset.calculateCurrentValue(),
      depreciation: asset.purchasePrice - asset.currentValue,
      depreciationRate: asset.category.depreciationRate
    }));
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 