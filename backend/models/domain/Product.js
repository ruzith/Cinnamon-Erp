const { pool } = require('../../config/db');

class Product {
  static async getWithDetails(id) {
    const [rows] = await pool.execute(`
      SELECT p.*, pc.name as category_name 
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id = ?
    `, [id]);
    return rows[0];
  }

  static async getAllProducts() {
    const [rows] = await pool.execute(`
      SELECT p.*, pc.name as category_name 
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      ORDER BY p.name
    `);
    return rows;
  }

  static async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO products SET ?',
      [data]
    );
    return this.getWithDetails(result.insertId);
  }

  static async update(id, data) {
    const [result] = await pool.execute(
      'UPDATE products SET ? WHERE id = ?',
      [data, id]
    );
    if (result.affectedRows === 0) return null;
    return this.getWithDetails(id);
  }

  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Product; 