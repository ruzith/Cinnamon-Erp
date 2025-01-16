const express = require('express');
const router = express.Router();
const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { validateCustomer } = require('../validators/customerValidator');
const { protect } = require('../middleware/authMiddleware');
const pool = require('../config/database');

router.route('/')
  .get(getCustomers)
  .post(protect, async (req, res) => {
    try {
      const { error } = validateCustomer(req.body);
      if (error) {
        return res.status(400).json({
          message: 'Validation error',
          error: error.details[0].message
        });
      }

      const [result] = await pool.execute(
        `INSERT INTO customers
         (name, email, phone, address, credit_limit, current_balance, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.body.name,
          req.body.email || null,
          req.body.phone || null,
          req.body.address || null,
          req.body.credit_limit || 0,
          req.body.current_balance || 0,
          req.body.status || 'active',
          req.body.created_by
        ]
      );

      const [customer] = await pool.execute(
        'SELECT * FROM customers WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(customer[0]);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ message: 'Error creating customer' });
    }
  });

router.route('/:id')
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;