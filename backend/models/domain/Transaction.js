const BaseModel = require('../base/BaseModel');

class Transaction extends BaseModel {
  constructor() {
    super('transactions');
    this.validStatuses = ['draft', 'posted', 'void'];
    this.validCategories = [
      'sales_income',
      'production_expense',
      'maintenance_expense',
      'utility_expense',
      'other_expense',
      'credit_contribution',
      'manufacturing_cost',
      'raw_material_payment',
      'salary_payment'
    ];
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
             u.name as created_by_name,
             e.name as employee_name,
             e.id as employee_code,
             CASE
               WHEN t.type = 'salary' THEN e.name
               WHEN t.type = 'manufacturing_payment' THEN mo.order_number
               ELSE NULL
             END as reference_details
      FROM transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN employees e ON t.employee_id = e.id
      LEFT JOIN manufacturing_orders mo ON t.reference = mo.order_number
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
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Validate status
      if (!this.validStatuses.includes(transactionData.status)) {
        throw new Error(`Invalid status. Must be one of: ${this.validStatuses.join(', ')}`);
      }

      // Validate category
      if (!this.validCategories.includes(transactionData.category)) {
        throw new Error(`Invalid category. Must be one of: ${this.validCategories.join(', ')}`);
      }

      // Generate reference number if not provided
      if (!transactionData.reference) {
        transactionData.reference = await this.generateReference();
      }

      // Create transaction record
      const [result] = await connection.execute(
        `INSERT INTO transactions (
          date, reference, description, status,
          type, amount, category,
          well_id, lease_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionData.date,
          transactionData.reference,
          transactionData.description,
          transactionData.status,
          transactionData.type,
          transactionData.amount,
          transactionData.category,
          transactionData.well_id,
          transactionData.lease_id,
          transactionData.created_by
        ]
      );
      const transactionId = result.insertId;

      // Create transaction entries
      for (const entry of entries) {
        await connection.execute(
          `INSERT INTO transactions_entries (
            transaction_id, account_id, description,
            debit, credit
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            transactionId,
            entry.account_id,
            entry.description,
            entry.debit,
            entry.credit
          ]
        );

        // Update account balance if transaction is posted
        if (transactionData.status === 'posted') {
          const [account] = await connection.execute(
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

          await connection.execute(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            [amount, entry.account_id]
          );
        }
      }

      await connection.commit();
      return this.getWithDetails(transactionId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
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