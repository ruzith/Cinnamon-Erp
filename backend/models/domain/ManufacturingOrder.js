const BaseModel = require('../base/BaseModel');
const Inventory = require('./Inventory');

class ManufacturingOrder extends BaseModel {
  constructor() {
    super('manufacturing_orders');
  }

  async generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const [result] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM manufacturing_orders WHERE YEAR(created_at) = YEAR(CURRENT_DATE)'
    );
    const count = result[0].count + 1;
    return `MO${year}${count.toString().padStart(4, '0')}`;
  }

  async getWithDetails(id) {
    const [rows] = await this.pool.execute(`
      SELECT mo.*,
             p.name as product_name,
             u1.name as assigned_to_name,
             u2.name as created_by_name
      FROM manufacturing_orders mo
      JOIN products p ON mo.product_id = p.id
      LEFT JOIN users u1 ON mo.assigned_to = u1.id
      LEFT JOIN users u2 ON mo.created_by = u2.id
      WHERE mo.id = ?
    `, [id]);
    return rows[0];
  }

  async getAllOrders() {
    const [rows] = await this.pool.execute(`
      SELECT mo.*,
             p.name as product_name,
             u1.name as assigned_to_name,
             u2.name as created_by_name
      FROM manufacturing_orders mo
      JOIN products p ON mo.product_id = p.id
      LEFT JOIN users u1 ON mo.assigned_to = u1.id
      LEFT JOIN users u2 ON mo.created_by = u2.id
      ORDER BY mo.created_at DESC
    `);
    return rows;
  }

  async create(orderData) {
    if (!orderData.order_number) {
      orderData.order_number = await this.generateOrderNumber();
    }
    
    // Convert object keys and values into arrays for SQL query
    const columns = Object.keys(orderData);
    const values = Object.values(orderData);
    const placeholders = columns.map(() => '?').join(', ');
    
    const [result] = await this.pool.execute(
      `INSERT INTO manufacturing_orders (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    return this.getWithDetails(result.insertId);
  }

  async update(id, orderData) {
    // Convert object into SET clause
    const setClause = Object.entries(orderData)
      .map(([key, _]) => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(orderData), id];

    await this.pool.execute(
      `UPDATE manufacturing_orders SET ${setClause} WHERE id = ?`,
      values
    );
    
    return this.getWithDetails(id);
  }

  async delete(id) {
    const [order] = await this.pool.execute(
      'SELECT status FROM manufacturing_orders WHERE id = ?',
      [id]
    );

    if (!order[0]) {
      throw new Error('Manufacturing order not found');
    }

    if (['in-progress', 'completed'].includes(order[0].status)) {
      throw new Error('Cannot delete orders that are in progress or completed');
    }

    await this.pool.execute(
      'DELETE FROM manufacturing_orders WHERE id = ?',
      [id]
    );
  }

  async startProduction(id, materials) {
    const order = await this.getWithDetails(id);
    if (!order) {
      throw new Error('Manufacturing order not found');
    }

    if (order.status !== 'planned') {
      throw new Error('Order must be in planned status to start production');
    }

    await Inventory.allocateToManufacturing(id, materials);
    await this.update(id, { status: 'in_progress' });
  }

  async completeProduction(id, productData) {
    const order = await this.getWithDetails(id);
    if (!order) {
      throw new Error('Manufacturing order not found');
    }

    if (order.status !== 'in_progress') {
      throw new Error('Order must be in progress to complete production');
    }

    await Inventory.addManufacturedProduct(id, productData);
    await this.update(id, { status: 'completed' });
  }
}

module.exports = new ManufacturingOrder(); 