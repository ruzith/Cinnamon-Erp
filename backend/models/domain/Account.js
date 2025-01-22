const BaseModel = require('../base/BaseModel');

class Account extends BaseModel {
  constructor() {
    super('accounts');
  }

  // Get account by code (e.g. 1001 for Cash)
  async findByCode(code) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM accounts WHERE code = ? AND status = "active"',
      [code]
    );
    return rows[0];
  }

  // Create a transaction with double-entry bookkeeping
  async createTransaction(data) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert main transaction record
      const [result] = await connection.execute(`
        INSERT INTO transactions (
          date, reference, description, type, category, amount,
          status, payment_method, employee_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.date,
        data.reference,
        data.description,
        data.type,
        data.category,
        data.amount,
        data.status || 'draft',
        data.payment_method || 'cash',
        data.employee_id || null,
        data.created_by
      ]);

      const transactionId = result.insertId;

      // Insert transaction entries (double-entry)
      for (const entry of data.entries) {
        await connection.execute(`
          INSERT INTO transactions_entries (
            transaction_id, account_id, description, debit, credit
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          transactionId,
          entry.account_id,
          entry.description || data.description,
          entry.debit || 0,
          entry.credit || 0
        ]);
      }

      await connection.commit();
      return transactionId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Post a transaction (change status from draft to posted)
  async postTransaction(id) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update transaction status
      await connection.execute(
        'UPDATE transactions SET status = "posted" WHERE id = ?',
        [id]
      );

      // Get transaction entries
      const [entries] = await connection.execute(`
        SELECT te.*, a.type as account_type
        FROM transactions_entries te
        JOIN accounts a ON te.account_id = a.id
        WHERE te.transaction_id = ?
      `, [id]);

      // Update account balances based on account type and debit/credit entries
      for (const entry of entries) {
        let balanceChange;

        // For asset and expense accounts:
        // Debit increases balance, Credit decreases balance
        if (entry.account_type === 'asset' || entry.account_type === 'expense') {
          balanceChange = entry.debit - entry.credit;
        }
        // For liability, equity, and revenue accounts:
        // Credit increases balance, Debit decreases balance
        else {
          balanceChange = entry.credit - entry.debit;
        }

        await connection.execute(`
          UPDATE accounts
          SET balance = balance + ?
          WHERE id = ?
        `, [balanceChange, entry.account_id]);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get general ledger entries for an account
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

  // Get trial balance
  async getTrialBalance() {
    const [rows] = await this.pool.execute(`
      SELECT
        a.code,
        a.name,
        a.type,
        a.category,
        SUM(CASE
          WHEN a.type IN ('asset', 'expense') THEN a.balance
          ELSE -a.balance
        END) as balance
      FROM accounts a
      WHERE a.status = 'active'
      GROUP BY a.code, a.name, a.type, a.category
      ORDER BY a.code
    `);
    return rows;
  }

  // Get balance sheet
  async getBalanceSheet() {
    const [rows] = await this.pool.execute(`
      SELECT
        a.type,
        a.category,
        SUM(a.balance) as total
      FROM accounts a
      WHERE a.status = 'active'
        AND a.type IN ('asset', 'liability', 'equity')
      GROUP BY a.type, a.category
      ORDER BY
        FIELD(a.type, 'asset', 'liability', 'equity'),
        a.category
    `);
    return rows;
  }

  // Get income statement
  async getIncomeStatement(startDate, endDate) {
    const [rows] = await this.pool.execute(`
      SELECT
        a.type,
        a.category,
        SUM(CASE
          WHEN a.type = 'revenue' THEN te.credit - te.debit
          ELSE te.debit - te.credit
        END) as amount
      FROM accounts a
      JOIN transactions_entries te ON a.id = te.account_id
      JOIN transactions t ON te.transaction_id = t.id
      WHERE t.status = 'posted'
        AND t.date BETWEEN ? AND ?
        AND a.type IN ('revenue', 'expense')
      GROUP BY a.type, a.category
      ORDER BY a.type, a.category
    `, [startDate, endDate]);
    return rows;
  }

  // Get cash flow statement
  async getCashFlow(startDate, endDate) {
    const [rows] = await this.pool.execute(`
      SELECT
        a.category as activity_type,
        SUM(CASE
          WHEN a.type IN ('asset', 'expense') THEN te.debit - te.credit
          ELSE te.credit - te.debit
        END) as amount
      FROM accounts a
      JOIN transactions_entries te ON a.id = te.account_id
      JOIN transactions t ON te.transaction_id = t.id
      WHERE t.status = 'posted'
        AND t.date BETWEEN ? AND ?
        AND a.code LIKE '1%' -- Cash and cash equivalents
      GROUP BY a.category
      ORDER BY a.category
    `, [startDate, endDate]);
    return rows;
  }

  // Get cash book
  async getCashBook(startDate, endDate) {
    const connection = await this.pool.getConnection();
    try {
      // Start with zero balance
      const openingBalance = 0;

      // Get all transactions including and before the start date
      const [transactions] = await connection.execute(`
        SELECT
          t.date,
          t.reference,
          t.description,
          CASE WHEN te.debit > 0 THEN te.debit ELSE 0 END as receipt,
          CASE WHEN te.credit > 0 THEN te.credit ELSE 0 END as payment
        FROM transactions t
        JOIN transactions_entries te ON t.id = te.transaction_id
        JOIN accounts a ON te.account_id = a.id
        WHERE
          a.code = '1001'
          AND t.status = 'posted'
          AND t.date <= ?
        ORDER BY t.date, t.id
      `, [endDate]);

      // Calculate running balance for all transactions
      let runningBalance = openingBalance;
      const allTransactions = transactions.map(t => {
        const receipt = Number(t.receipt);
        const payment = Number(t.payment);
        runningBalance = runningBalance + receipt - payment;

        return {
          ...t,
          receipt,
          payment,
          balance: runningBalance
        };
      });

      // Split transactions into before and during period
      const beforePeriod = allTransactions.filter(t =>
        new Date(t.date) < new Date(startDate)
      );

      const duringPeriod = allTransactions.filter(t =>
        new Date(t.date) >= new Date(startDate) &&
        new Date(t.date) <= new Date(endDate)
      );

      // Calculate opening balance from transactions before period
      const actualOpeningBalance = beforePeriod.reduce((balance, t) =>
        balance + t.receipt - t.payment,
        openingBalance
      );

      // Recalculate running balances for period transactions
      runningBalance = actualOpeningBalance;
      const formattedTransactions = duringPeriod.map(t => ({
        ...t,
        balance: (runningBalance = runningBalance + t.receipt - t.payment)
      }));

      // Calculate totals
      const totalReceipts = formattedTransactions.reduce((sum, t) => sum + t.receipt, 0);
      const totalPayments = formattedTransactions.reduce((sum, t) => sum + t.payment, 0);
      const closingBalance = actualOpeningBalance + totalReceipts - totalPayments;
      return {
        openingBalance: actualOpeningBalance,
        entries: formattedTransactions,
        totalReceipts,
        totalPayments,
        closingBalance
      };

    } catch (error) {
      console.error('Error in getCashBook:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new Account();