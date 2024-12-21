const BaseModel = require('../base/BaseModel');

class Customer extends BaseModel {
  constructor() {
    super('customers');
  }

  async getWithDetails(id) {
    const [rows] = await this.pool.execute(`
      SELECT c.*,
             u.name as created_by_name
      FROM customers c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `, [id]);
    return rows[0];
  }

  async getAllCustomers() {
    const [rows] = await this.pool.execute(`
      SELECT c.*,
             u.name as created_by_name
      FROM customers c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.name ASC
    `);
    return rows;
  }

  async create(customerData) {
    const [result] = await this.pool.execute(
      'INSERT INTO customers SET ?',
      customerData
    );
    return this.getWithDetails(result.insertId);
  }

  async update(id, customerData) {
    await this.pool.execute(
      'UPDATE customers SET ? WHERE id = ?',
      [customerData, id]
    );
    return this.getWithDetails(id);
  }

  async delete(id) {
    const [customer] = await this.pool.execute(
      'SELECT current_balance FROM customers WHERE id = ?',
      [id]
    );

    if (!customer[0]) {
      throw new Error('Customer not found');
    }

    if (customer[0].current_balance !== 0) {
      throw new Error('Cannot delete customer with outstanding balance');
    }

    await this.pool.execute(
      'DELETE FROM customers WHERE id = ?',
      [id]
    );
  }
}

module.exports = new Customer(); 