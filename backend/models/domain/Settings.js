const BaseModel = require('../base/BaseModel');
const { pool } = require('../../config/db');

class Settings extends BaseModel {
  constructor() {
    super('settings');
  }

  async getSettings() {
    const [settings] = await this.findAll({ limit: 1 });
    return settings || null;
  }

  async updateSettings(data) {
    const settings = await this.getSettings();
    const oldCurrency = settings ? settings.default_currency : null;
    const newCurrency = data.default_currency;

    // If currency is changing, we need to update all monetary values
    if (oldCurrency && newCurrency && oldCurrency !== newCurrency) {
      await this.updateMonetaryValues(oldCurrency, newCurrency);
    }

    if (settings) {
      return this.update(settings.id, data);
    }
    return this.create(data);
  }

  async updateMonetaryValues(oldCurrencyId, newCurrencyId) {
    const [oldCurrency] = await pool.execute(
      'SELECT rate FROM currencies WHERE id = ?',
      [oldCurrencyId]
    );
    const [newCurrency] = await pool.execute(
      'SELECT rate FROM currencies WHERE id = ?',
      [newCurrencyId]
    );

    if (!oldCurrency[0] || !newCurrency[0]) {
      throw new Error('Currency not found');
    }

    const conversionRate = newCurrency[0].rate / oldCurrency[0].rate;

    // Start transaction using the imported pool
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update all monetary values in different tables
      const tables = [
        { name: 'transactions', columns: ['amount'] },
        { name: 'purchase_invoices', columns: ['total_amount'] },
        { name: 'loans', columns: ['amount', 'remaining_balance'] },
        { name: 'loan_payments', columns: ['amount'] },
        { name: 'assets', columns: ['purchase_price', 'current_value'] },
        // Add other tables with monetary values
      ];

      for (const table of tables) {
        for (const column of table.columns) {
          await connection.execute(
            `UPDATE ${table.name} SET ${column} = ${column} * ?`,
            [conversionRate]
          );
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Helper method to get specific setting
  async getSetting(key) {
    const settings = await this.getSettings();
    return settings ? settings[key] : null;
  }

  // Helper method to update specific setting
  async updateSetting(key, value) {
    const settings = await this.getSettings();
    if (settings) {
      const updatedData = { ...settings, [key]: value };
      return this.update(settings.id, updatedData);
    }
    return this.create({ [key]: value });
  }
}

module.exports = new Settings();