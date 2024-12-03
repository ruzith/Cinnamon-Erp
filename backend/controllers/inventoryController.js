const asyncHandler = require('express-async-handler');
const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
const getInventoryItems = asyncHandler(async (req, res) => {
  const inventory = await Inventory.find().sort('productName');
  res.json(inventory);
});

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
const getInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Inventory item not found');
  }
  res.json(item);
});

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private
const createInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.create(req.body);
  res.status(201).json(item);
});

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private
const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  const updatedItem = await Inventory.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  res.json(updatedItem);
});

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  // Check if there are any transactions for this item
  const transactionCount = await InventoryTransaction.countDocuments({ itemId: req.params.id });
  if (transactionCount > 0) {
    res.status(400);
    throw new Error('Cannot delete item with existing transactions');
  }

  await item.deleteOne();
  res.json({ message: 'Inventory item removed' });
});

// @desc    Get all inventory transactions
// @route   GET /api/inventory/transactions
// @access  Private
const getInventoryTransactions = asyncHandler(async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find()
      .populate('itemId')
      .sort('-date');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create inventory transaction
// @route   POST /api/inventory/transactions
// @access  Private
const createInventoryTransaction = asyncHandler(async (req, res) => {
  const { type, itemId, quantity, reference, notes } = req.body;

  const transaction = await InventoryTransaction.create({
    type,
    itemId,
    quantity,
    reference,
    notes
  });

  // Update inventory quantity
  const inventory = await Inventory.findById(itemId);
  if (!inventory) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  if (type === 'IN') {
    inventory.quantity += quantity;
  } else if (type === 'OUT') {
    inventory.quantity -= quantity;
  } else if (type === 'ADJUSTMENT') {
    inventory.quantity = quantity;
  }

  await inventory.save();

  res.status(201).json(transaction);
});

module.exports = {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryTransactions,
  createInventoryTransaction
}; 