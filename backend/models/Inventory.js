const BaseModel = require('./BaseModel');

class Inventory extends BaseModel {
  constructor() {
    super('inventory');
  }

  async findByProductName(productName) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM inventory WHERE product_name = ?',
      [productName]
    );
    return rows[0];
  }

  async updateQuantity(id, quantity) {
    await this.pool.execute(
      'UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, id]
    );
    const [rows] = await this.pool.execute('SELECT * FROM inventory WHERE id = ?', [id]);
    return rows[0];
  }

  async getLowStockItems() {
    const [rows] = await this.pool.execute(
      'SELECT * FROM inventory WHERE quantity <= min_stock_level ORDER BY product_name'
    );
    return rows;
  }

  async getTransactionHistory(id) {
    const [rows] = await this.pool.execute(`
      SELECT it.*, i.product_name
      FROM inventory_transactions it
      JOIN inventory i ON it.item_id = i.id
      WHERE it.item_id = ?
      ORDER BY it.created_at DESC
    `, [id]);
    return rows;
  }
}

module.exports = new Inventory(); 