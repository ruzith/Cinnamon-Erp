const Product = require('../models/domain/Product');
const { validateProduct } = require('../validators/productValidator');
const { pool } = require('../config/db');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, pc.name as category_name 
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      ORDER BY p.name
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, pc.name as category_name 
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (!rows[0]) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { error } = validateProduct(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const [result] = await pool.execute(
      'INSERT INTO products SET ?',
      [req.body]
    );
    
    const [product] = await pool.execute(`
      SELECT p.*, pc.name as category_name 
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id = ?
    `, [result.insertId]);

    res.status(201).json(product[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { error } = validateProduct(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const [result] = await pool.execute(
      'UPDATE products SET ? WHERE id = ?',
      [req.body, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [product] = await pool.execute(`
      SELECT p.*, pc.name as category_name 
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id = ?
    `, [req.params.id]);

    res.json(product[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product removed' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        message: 'Cannot delete product that is referenced in other records' 
      });
    }
    res.status(500).json({ message: error.message });
  }
}; 