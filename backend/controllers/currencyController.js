const Currency = require('../models/domain/Currency');
const Settings = require('../models/domain/Settings');

exports.getAllCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.getAll();
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching currencies', error: error.message });
  }
};

exports.createCurrency = async (req, res) => {
  try {
    const { code, name, symbol, rate } = req.body;

    if (!code || !name || !symbol || !rate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const id = await Currency.create({ code, name, symbol, rate });
    res.status(201).json({ id, message: 'Currency created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating currency', error: error.message });
  }
};

exports.updateCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, symbol, rate, status } = req.body;

    if (!code || !name || !symbol || !rate || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get old rate before update
    const oldCurrency = await Currency.getById(id);
    if (!oldCurrency) {
      return res.status(404).json({ message: 'Currency not found' });
    }

    const settings = await Settings.getSettings();
    if (settings.default_currency === parseInt(id) && oldCurrency.rate !== rate) {
      const rateRatio = rate / oldCurrency.rate;
      await Currency.updateAllRates(rateRatio, id);
    }

    const success = await Currency.update(id, { code, name, symbol, rate, status });
    if (success) {
      res.json({ message: 'Currency updated successfully' });
    } else {
      res.status(404).json({ message: 'Currency not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating currency', error: error.message });
  }
};

exports.deleteCurrency = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if currency is the default currency
    const settings = await Settings.getSettings();
    if (settings && settings.default_currency === parseInt(id)) {
      return res.status(400).json({
        message: 'Cannot delete currency that is set as default currency. Please change default currency first.'
      });
    }

    const success = await Currency.delete(id);
    if (success) {
      res.json({ message: 'Currency deleted successfully' });
    } else {
      res.status(404).json({ message: 'Currency not found' });
    }
  } catch (error) {
    if (error.message.includes('foreign key constraint')) {
      res.status(400).json({
        message: 'Cannot delete currency that is in use. Please remove all references to this currency first.'
      });
    } else {
      res.status(500).json({
        message: 'Error deleting currency',
        error: error.message
      });
    }
  }
};