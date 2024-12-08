const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getSettings,
  updateSettings,
  getSetting,
  updateSetting,
  addCurrency,
  editCurrency,
  deleteCurrency,
  getCurrencies
} = require('../controllers/settingsController');

// General settings routes
router.get('/', protect, getSettings);
router.put('/', protect, authorize('admin'), upload.single('logo'), updateSettings);
router.get('/:key', protect, getSetting);
router.put('/:key', protect, authorize('admin'), updateSetting);

// Currency routes
router.get('/currencies', protect, getCurrencies);
router.post('/currencies', protect, authorize('admin'), addCurrency);
router.put('/currencies/:code', protect, authorize('admin'), editCurrency);
router.delete('/currencies/:code', protect, authorize('admin'), deleteCurrency);

module.exports = router; 