const Settings = require('../models/Settings');
const asyncHandler = require('express-async-handler');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    // Create default settings if none exist
    settings = await Settings.create({
      companyName: 'Your Company',
      companyAddress: 'Your Address',
      companyPhone: 'Your Phone',
      currencies: [{
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        rate: 1
      }]
    });
  }
  
  res.json(settings);
});

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne();

  if (!settings) {
    res.status(404);
    throw new Error('Settings not found');
  }

  // Handle file upload if there's a logo
  if (req.file) {
    req.body.logo = req.file.path;
  }

  // Parse currencies if they're sent as string
  if (typeof req.body.currencies === 'string') {
    req.body.currencies = JSON.parse(req.body.currencies);
  }

  const updatedSettings = await Settings.findByIdAndUpdate(
    settings._id,
    {
      ...req.body,
      updatedAt: Date.now()
    },
    { new: true }
  );

  res.json(updatedSettings);
});

// @desc    Add currency
// @route   POST /api/settings/currencies
// @access  Private/Admin
const addCurrency = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne();

  if (!settings) {
    res.status(404);
    throw new Error('Settings not found');
  }

  // Check if currency already exists
  if (settings.currencies.some(c => c.code === req.body.code.toUpperCase())) {
    res.status(400);
    throw new Error('Currency already exists');
  }

  settings.currencies.push({
    ...req.body,
    code: req.body.code.toUpperCase()
  });
  await settings.save();

  res.json(settings);
});

// @desc    Edit currency
// @route   PUT /api/settings/currencies/:code
// @access  Private/Admin
const editCurrency = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne();
  const currencyIndex = settings.currencies.findIndex(
    c => c.code === req.params.code.toUpperCase()
  );

  if (currencyIndex === -1) {
    res.status(404);
    throw new Error('Currency not found');
  }

  settings.currencies[currencyIndex] = {
    ...settings.currencies[currencyIndex],
    ...req.body,
    code: req.params.code.toUpperCase()
  };

  await settings.save();
  res.json(settings);
});

// @desc    Delete currency
// @route   DELETE /api/settings/currencies/:code
// @access  Private/Admin
const deleteCurrency = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne();

  // Prevent deleting default currency
  if (req.params.code === settings.defaultCurrency) {
    res.status(400);
    throw new Error('Cannot delete default currency');
  }

  settings.currencies = settings.currencies.filter(
    c => c.code !== req.params.code.toUpperCase()
  );

  await settings.save();
  res.json(settings);
});

module.exports = {
  getSettings,
  updateSettings,
  addCurrency,
  editCurrency,
  deleteCurrency
}; 