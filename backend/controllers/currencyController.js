const Currency = require('../models/domain/Currency');

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
    
    // Basic validation
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
    
    // Basic validation
    if (!code || !name || !symbol || !rate || !status) {
      return res.status(400).json({ message: 'All fields are required' });
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
    const success = await Currency.delete(id);
    if (success) {
      res.json({ message: 'Currency deleted successfully' });
    } else {
      res.status(404).json({ message: 'Currency not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting currency', error: error.message });
  }
}; 