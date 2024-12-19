const BaseModel = require('./BaseModel');

class Setting extends BaseModel {
  constructor() {
    super('settings');
  }

  async get(key) {
    const [rows] = await this.pool.execute(
      'SELECT value FROM settings WHERE `key` = ?',
      [key]
    );
    return rows[0]?.value;
  }

  async set(key, value) {
    await this.pool.execute(
      'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [key, value, value]
    );
    return { key, value };
  }

  async getAll() {
    const [rows] = await this.pool.execute('SELECT * FROM settings');
    return rows.reduce((acc, row) => ({
      ...acc,
      [row.key]: row.value
    }), {});
  }
}

module.exports = new Setting(); 