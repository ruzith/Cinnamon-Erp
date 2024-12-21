const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboardData, updateMonthlyTarget } = require('../controllers/dashboardController');

router.get('/', protect, getDashboardData);
router.put('/monthly-target/:period', protect, updateMonthlyTarget);

module.exports = router;
