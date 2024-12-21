const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getSettings,
  updateSettings,
  getSetting,
  updateSetting,
} = require('../controllers/settingsController');

// General settings routes
router.get('/', protect, getSettings);
router.put('/', protect, authorize('admin'), upload.single('logo'), updateSettings);
router.get('/:key', protect, getSetting);
router.put('/:key', protect, authorize('admin'), updateSetting);

module.exports = router; 