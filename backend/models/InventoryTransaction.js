const BaseModel = require('./BaseModel');

class InventoryTransaction extends BaseModel {
  constructor() {
    super('inventory_transactions');
  }

  async getByItemId(itemId) {
    const [rows] = await this.pool.execute(`
      SELECT it.*,
             i.product_name,
             u.name as created_by_name
      FROM inventory_transactions it
      JOIN inventory i ON it.item_id = i.id
      LEFT JOIN users u ON it.created_by = u.id
      WHERE it.item_id = ?
      ORDER BY it.created_at DESC
    `, [itemId]);
    return rows;
  }

  async create(transactionData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create transaction record
      const [result] = await connection.execute(
        'INSERT INTO inventory_transactions SET ?',
        transactionData
      );

      // Update inventory quantity
      const quantityChange = transactionData.type === 'OUT' ? -transactionData.quantity : transactionData.quantity;
      await connection.execute(
        'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
        [quantityChange, transactionData.item_id]
      );

      await connection.commit();
      return this.findById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new InventoryTransaction(); 