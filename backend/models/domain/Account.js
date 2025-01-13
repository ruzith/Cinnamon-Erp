const BaseModel = require('../base/BaseModel');

class Account extends BaseModel {
  constructor() {
    super('accounts');
  }

  async findByCode(code) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM accounts WHERE code = ?',
      [code]
    );
    return rows[0];
  }

  async updateBalance(id, amount, type) {
    await this.pool.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [type === 'debit' ? amount : -amount, id]
    );
  }

  async getTrialBalance() {
    const [rows] = await this.pool.execute(`
      SELECT
        type,
        category,
        SUM(CASE
          WHEN type IN ('asset', 'expense') THEN balance
          ELSE -balance
        END) as balance
      FROM accounts
      WHERE status = 'active'
      GROUP BY type, category
      ORDER BY type, category
    `);
    return rows;
  }

  async getBalanceSheet() {
    const [rows] = await this.pool.execute(`
      SELECT
        type,
        category,
        SUM(balance) as total
      FROM accounts
      WHERE status = 'active'
        AND type IN ('asset', 'liability', 'equity')
      GROUP BY type, category
      ORDER BY
        FIELD(type, 'asset', 'liability', 'equity'),
        FIELD(category, 'current', 'fixed', 'current-liability', 'long-term-liability', 'capital', 'operational')
    `);
    return rows;
  }

  async getIncomeStatement(startDate, endDate) {
    const [rows] = await this.pool.execute(`
      SELECT
        a.type,
        SUM(CASE
          WHEN t.type = 'revenue' THEN t.amount
          ELSE -t.amount
        END) as amount
      FROM accounts a
      JOIN transactions_entries te ON a.id = te.account_id
      JOIN transactions t ON te.transaction_id = t.id
      WHERE t.status = 'posted'
        AND t.date BETWEEN ? AND ?
        AND a.type IN ('revenue', 'expense')
      GROUP BY a.type
      ORDER BY a.type
    `, [startDate, endDate]);
    return rows;
  }

  async getCashFlow(startDate, endDate) {
    const [rows] = await this.pool.execute(`
      SELECT
        a.category,
        SUM(CASE
          WHEN a.type IN ('asset', 'expense') THEN te.debit - te.credit
          ELSE te.credit - te.debit
        END) as amount
      FROM accounts a
      JOIN transactions_entries te ON a.id = te.account_id
      JOIN transactions t ON te.transaction_id = t.id
      WHERE t.status = 'posted'
        AND t.date BETWEEN ? AND ?
        AND a.category IN ('current', 'operational')
      GROUP BY a.category
      ORDER BY a.category
    `, [startDate, endDate]);
    return rows;
  }

  async getLedgerEntries(accountId, startDate, endDate) {
    const [rows] = await this.pool.execute(`
      SELECT
        t.date,
        t.reference,
        t.description,
        te.debit,
        te.credit,
        t.status,
        CASE
          WHEN a.type IN ('asset', 'expense') THEN @balance := @balance + (te.debit - te.credit)
          ELSE @balance := @balance + (te.credit - te.debit)
        END as running_balance
      FROM transactions t
      JOIN transactions_entries te ON t.id = te.transaction_id
      JOIN accounts a ON te.account_id = a.id
      CROSS JOIN (SELECT @balance := 0) AS vars
      WHERE te.account_id = ?
        AND t.date BETWEEN ? AND ?
        AND t.status = 'posted'
      ORDER BY t.date, t.id
    `, [accountId, startDate, endDate]);

    return rows;
  }

  async getCashBook(startDate, endDate) {
    const [rows] = await this.pool.execute(`
      SELECT
        t.date,
        t.reference,
        t.description,
        CASE WHEN te.debit > 0 THEN te.debit ELSE NULL END as receipt,
        CASE WHEN te.credit > 0 THEN te.credit ELSE NULL END as payment,
        @balance := @balance + (te.debit - te.credit) as balance
      FROM transactions t
      JOIN transactions_entries te ON t.id = te.transaction_id
      JOIN accounts a ON te.account_id = a.id
      CROSS JOIN (SELECT @balance := 0) AS vars
      WHERE a.code = '1001' -- Cash account code
        AND t.date BETWEEN ? AND ?
        AND t.status = 'posted'
      ORDER BY t.date, t.id
    `, [startDate, endDate]);

    return rows;
  }
}

module.exports = new Account();