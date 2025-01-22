const { pool } = require('../../config/db');

class Currency {
  static async getAll() {
    const [currencies] = await pool.query(
      'SELECT * FROM currencies ORDER BY code'
    );
    return currencies;
  }

  static async getActive() {
    const [currencies] = await pool.query(
      'SELECT * FROM currencies WHERE status = "active" ORDER BY code'
    );
    return currencies;
  }

  static async getById(id) {
    const [currency] = await pool.query(
      'SELECT * FROM currencies WHERE id = ?',
      [id]
    );
    return currency[0];
  }

  static async create(currencyData) {
    const { code, name, symbol, rate } = currencyData;
    const [result] = await pool.query(
      'INSERT INTO currencies (code, name, symbol, rate) VALUES (?, ?, ?, ?)',
      [code.toUpperCase(), name, symbol, rate]
    );
    return result.insertId;
  }

  static async update(id, currencyData) {
    const { code, name, symbol, rate, status } = currencyData;
    const [result] = await pool.query(
      'UPDATE currencies SET code = ?, name = ?, symbol = ?, rate = ?, status = ? WHERE id = ?',
      [code.toUpperCase(), name, symbol, rate, status, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    // First check if currency is in use
    const inUse = await this.isInUse(id);
    if (inUse) {
      throw new Error('Cannot delete currency that is set as default currency');
    }

    const [result] = await pool.query(
      'DELETE FROM currencies WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async updateAllRates(ratio, excludeId) {
    const [result] = await pool.query(
      'UPDATE currencies SET rate = rate * ? WHERE id != ?',
      [ratio, excludeId]
    );
    return result.affectedRows > 0;
  }

  static async isInUse(id) {
    // Check settings table for default currency
    const [settings] = await pool.query(
      'SELECT id FROM settings WHERE default_currency = ?',
      [id]
    );

    return settings.length > 0;
  }
}

module.exports = Currency;