const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser
} = require('../controllers/userController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.route('/')
  .get(protect, authorize('admin'), getUsers)
  .post(protect, authorize('admin'), createUser);

router.route('/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router; 