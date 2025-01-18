const BaseModel = require('./BaseModel');

class Sale extends BaseModel {
  constructor() {
    super('sales');
  }

  async generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const [result] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM sales WHERE YEAR(created_at) = YEAR(CURRENT_DATE)'
    );
    const count = result[0].count + 1;
    return `SO${year}${count.toString().padStart(4, '0')}`;
  }

  async getWithDetails(id) {
    const [sale] = await this.pool.execute(`
      SELECT s.*,
             c.name as customer_name,
             u.name as created_by_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);

    if (!sale[0]) return null;

    const [items] = await this.pool.execute(`
      SELECT si.*, i.product_name
      FROM sale_items si
      JOIN inventory i ON si.product_id = i.id
      WHERE si.sale_id = ?
    `, [id]);

    return {
      ...sale[0],
      items
    };
  }

  async createWithItems(saleData, items) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Generate order number if not provided
      if (!saleData.order_number) {
        saleData.order_number = await this.generateOrderNumber();
      }

      // Create sale record
      const [result] = await connection.execute(
        'INSERT INTO sales SET ?',
        saleData
      );
      const saleId = result.insertId;

      // Create sale items
      for (const item of items) {
        await connection.execute(
          'INSERT INTO sale_items SET ?',
          { ...item, sale_id: saleId }
        );

        if (saleData.status === 'completed') {
          // Update inventory
          await connection.execute(
            'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }
      }

      await connection.commit();
      return this.getWithDetails(saleId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new Sale();