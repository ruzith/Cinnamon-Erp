const Settings = require('../models/Settings');
const Currency = require('../models/Currency');
const { validateSettings, validateCurrency } = require('../validators/settingsValidator');
const { pool } = require('../config/db');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json(settings || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    const { error } = validateSettings(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const settings = await Settings.updateSettings(req.body);
    res.status(200).json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get specific setting
// @route   GET /api/settings/:key
// @access  Private
exports.getSetting = async (req, res) => {
  try {
    const value = await Settings.getSetting(req.params.key);
    if (value === null) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.status(200).json({ [req.params.key]: value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update specific setting
// @route   PUT /api/settings/:key
// @access  Private/Admin
exports.updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ message: 'Value is required' });
    }

    const setting = await Settings.updateSetting(req.params.key, value);
    res.status(200).json(setting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all currencies
// @route   GET /api/settings/currencies
// @access  Private
exports.getCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.getActiveCurrencies();
    res.status(200).json(currencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new currency
// @route   POST /api/settings/currencies
// @access  Private/Admin
exports.addCurrency = async (req, res) => {
  try {
    const { error } = validateCurrency(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const currency = await Currency.create(req.body);

      // If this is the first currency, set it as default in settings
      const settings = await Settings.getSettings();
      if (!settings.default_currency) {
        await Settings.updateSetting('default_currency', currency.code);
      }

      await connection.commit();
      res.status(201).json(currency);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Edit currency
// @route   PUT /api/settings/currencies/:code
// @access  Private/Admin
exports.editCurrency = async (req, res) => {
  try {
    const { error } = validateCurrency(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const currency = await Currency.findByCode(req.params.code);
    if (!currency) {
      return res.status(404).json({ message: 'Currency not found' });
    }

    const updated = await Currency.update(currency.id, {
      ...req.body,
      code: req.params.code // Don't allow code to be changed
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete currency
// @route   DELETE /api/settings/currencies/:code
// @access  Private/Admin
exports.deleteCurrency = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    if (settings.default_currency === req.params.code) {
      return res.status(400).json({ message: 'Cannot delete default currency' });
    }

    const currency = await Currency.findByCode(req.params.code);
    if (!currency) {
      return res.status(404).json({ message: 'Currency not found' });
    }

    await Currency.update(currency.id, { status: 'inactive' });
    res.status(200).json({ message: 'Currency deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 