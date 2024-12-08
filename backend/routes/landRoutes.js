const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getLands,
  getLand,
  createLand,
  updateLand,
  deleteLand
} = require('../controllers/landController');

router.get('/', protect, getLands);
router.get('/:id', protect, getLand);
router.post('/', protect, authorize('admin', 'manager'), createLand);
router.put('/:id', protect, authorize('admin', 'manager'), updateLand);
router.delete('/:id', protect, authorize('admin'), deleteLand);

module.exports = router; 