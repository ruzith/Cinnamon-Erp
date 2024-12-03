const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getSettings,
  updateSettings,
  addCurrency,
  editCurrency,
  deleteCurrency
} = require('../controllers/settingsController');

router.get('/', protect, getSettings);
router.put('/', protect, authorize('admin'), upload.single('logo'), updateSettings);
router.post('/currencies', protect, authorize('admin'), addCurrency);
router.put('/currencies/:code', protect, authorize('admin'), editCurrency);
router.delete('/currencies/:code', protect, authorize('admin'), deleteCurrency);

module.exports = router; 