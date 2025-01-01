const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getEmployeeGroups,
  getEmployeeGroup,
  createEmployeeGroup,
  updateEmployeeGroup,
  deleteEmployeeGroup,
  addGroupMembers,
  removeGroupMembers
} = require('../controllers/employeeGroupController');

router.get('/', protect, getEmployeeGroups);
router.get('/:id', protect, getEmployeeGroup);
router.post('/', protect, authorize('admin', 'manager'), createEmployeeGroup);
router.put('/:id', protect, authorize('admin', 'manager'), updateEmployeeGroup);
router.delete('/:id', protect, authorize('admin'), deleteEmployeeGroup);

router.post('/:id/members', protect, authorize('admin', 'manager'), addGroupMembers);
router.delete('/:id/members', protect, authorize('admin', 'manager'), removeGroupMembers);

module.exports = router;