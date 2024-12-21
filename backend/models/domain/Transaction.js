const BaseModel = require('../base/BaseModel');

class Transaction extends BaseModel {
  constructor() {
    super('transactions');
  }

  async generateReference() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const [result] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM transactions WHERE YEAR(created_at) = YEAR(CURRENT_DATE)'
    );
    const count = result[0].count + 1;
    
    return `TRX${year}${month}${count.toString().padStart(4, '0')}`;
  }

  async getWithDetails(id) {
    const [transaction] = await this.pool.execute(`
      SELECT t.*,
             w.name as well_name,
             l.name as lease_name,
             u.name as created_by_name
      FROM transactions t
      JOIN wells w ON t.well_id = w.id
      JOIN leases l ON t.lease_id = l.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `, [id]);

    if (!transaction[0]) return null;

    const [entries] = await this.pool.execute(`
      SELECT te.*,
             a.code as account_code,
             a.name as account_name,
             a.type as account_type
      FROM transactions_entries te
      JOIN accounts a ON te.account_id = a.id
      WHERE te.transaction_id = ?
      ORDER BY te.id ASC
    `, [id]);

    return {
      ...transaction[0],
      entries
    };
  }

  async createWithEntries(transactionData, entries) {
    await this.pool.beginTransaction();
    try {
      // Generate reference number if not provided
      if (!transactionData.reference) {
        transactionData.reference = await this.generateReference();
      }

      // Create transaction record
      const [result] = await this.pool.execute(
        'INSERT INTO transactions SET ?',
        transactionData
      );
      const transactionId = result.insertId;

      // Create transaction entries
      for (const entry of entries) {
        await this.pool.execute(
          'INSERT INTO transactions_entries SET ?',
          { ...entry, transaction_id: transactionId }
        );

        // Update account balance if transaction is posted
        if (transactionData.status === 'posted') {
          const [account] = await this.pool.execute(
            'SELECT * FROM accounts WHERE id = ?',
            [entry.account_id]
          );

          if (!account[0]) {
            throw new Error(`Account not found: ${entry.account_id}`);
          }

          const balanceChange = entry.debit - entry.credit;
          const amount = ['asset', 'expense'].includes(account[0].type) 
            ? balanceChange 
            : -balanceChange;

          await this.pool.execute(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            [amount, entry.account_id]
          );
        }
      }

      await this.pool.commit();
      return this.getWithDetails(transactionId);
    } catch (error) {
      await this.pool.rollback();
      throw error;
    }
  }

  async voidTransaction(id) {
    await this.pool.beginTransaction();
    try {
      const transaction = await this.getWithDetails(id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'void') {
        throw new Error('Transaction is already voided');
      }

      // Reverse account balances
      if (transaction.status === 'posted') {
        for (const entry of transaction.entries) {
          const balanceChange = entry.credit - entry.debit; // Reverse of original
          const amount = ['asset', 'expense'].includes(entry.account_type) 
            ? balanceChange 
            : -balanceChange;

          await this.pool.execute(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            [amount, entry.account_id]
          );
        }
      }

      // Update transaction status
      await this.pool.execute(
        'UPDATE transactions SET status = "void" WHERE id = ?',
        [id]
      );

      await this.pool.commit();
      return this.getWithDetails(id);
    } catch (error) {
      await this.pool.rollback();
      throw error;
    }
  }
}

module.exports = new Transaction(); 