const BaseModel = require('./BaseModel');

class Currency extends BaseModel {
  constructor() {
    super('currencies');
  }

  async findByCode(code) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM currencies WHERE code = ?',
      [code.toUpperCase()]
    );
    return rows[0];
  }

  async getActiveCurrencies() {
    const [rows] = await this.pool.execute(
      'SELECT * FROM currencies WHERE status = ? ORDER BY code',
      ['active']
    );
    return rows;
  }
}

module.exports = new Currency(); 