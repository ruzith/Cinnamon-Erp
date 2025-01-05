const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { pool } = require('../config/db');

const {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryTransactions,
  createInventoryTransaction,
  updateInventoryTransaction,
  getRawMaterials
} = require('../controllers/inventoryController');

// Inventory Items routes
router.route('/')
  .get(protect, getInventoryItems)
  .post(protect, createInventoryItem);

// Raw Materials route
router.get('/raw-materials', protect, getRawMaterials);

// Get finished goods
router.get('/finished-goods', protect, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, product_name, purchase_price, quantity, unit FROM inventory WHERE product_type = ? AND status = ?',
      ['finished_good', 'active']
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.route('/transactions')
  .get(protect, getInventoryTransactions)
  .post(protect, createInventoryTransaction);

router.route('/transactions/:id')
  .put(protect, updateInventoryTransaction);

router.route('/:id')
  .get(protect, getInventoryItem)
  .put(protect, updateInventoryItem)
  .delete(protect, deleteInventoryItem);

module.exports = router;