const { validateCustomer } = require('../validators/customerValidator');
const db = require('../config/database');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const [customers] = await db.query('SELECT * FROM customers WHERE status = "active" ORDER BY name');
    res.json(customers);
  } catch (error) {
    console.error('Error in getCustomers:', error);
    res.status(500).json({ message: 'Server error while fetching customers' });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const { error } = validateCustomer(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const {
      name,
      email,
      phone,
      address,
      credit_limit,
      current_balance,
      status,
      created_by
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO customers (
        name, email, phone, address, credit_limit, current_balance,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, address, credit_limit, current_balance,
       status, created_by]
    );

    const [newCustomer] = await db.query(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newCustomer[0]);
  } catch (error) {
    console.error('Error in createCustomer:', error);
    res.status(500).json({ message: 'Server error while creating customer' });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const { error } = validateCustomer(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const {
      name,
      email,
      phone,
      address,
      credit_limit,
      current_balance,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE customers
       SET name = ?, email = ?, phone = ?, address = ?,
           credit_limit = ?, current_balance = ?, status = ?
       WHERE id = ?`,
      [name, email, phone, address, credit_limit, current_balance,
       status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const [updatedCustomer] = await db.query(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedCustomer[0]);
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    res.status(500).json({ message: 'Server error while updating customer' });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
  try {
    // Soft delete by updating status to 'inactive'
    const [result] = await db.query(
      'UPDATE customers SET status = "inactive" WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    res.status(500).json({ message: 'Server error while deleting customer' });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
};