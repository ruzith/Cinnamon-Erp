const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDesignations,
  getDesignation,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  reassignEmployees
} = require('../controllers/designationController');

router.get('/', protect, getDesignations);
router.get('/:id', protect, getDesignation);
router.post('/', protect, authorize('admin'), createDesignation);
router.put('/:id', protect, authorize('admin'), updateDesignation);
router.post('/:id/reassign', protect, authorize('admin'), reassignEmployees);
router.delete('/:id', protect, authorize('admin'), deleteDesignation);

module.exports = router;