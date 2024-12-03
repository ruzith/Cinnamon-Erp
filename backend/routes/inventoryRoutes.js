const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryTransactions,
  createInventoryTransaction
} = require('../controllers/inventoryController');

// Inventory Items routes
router.route('/')
  .get(protect, getInventoryItems)
  .post(protect, createInventoryItem);

router.route('/transactions')
  .get(protect, getInventoryTransactions)
  .post(protect, createInventoryTransaction);

router.route('/:id')
  .get(protect, getInventoryItem)
  .put(protect, updateInventoryItem)
  .delete(protect, deleteInventoryItem);

module.exports = router; 