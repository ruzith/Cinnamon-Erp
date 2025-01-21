const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Account = require('../models/domain/Account');
const Transaction = require('../models/domain/Transaction');
const ExcelJS = require('exceljs');

// Account routes
router.get('/accounts', protect, async (req, res) => {
  try {
    const [rows] = await Account.pool.execute(`
      SELECT a.*
      FROM accounts a
      WHERE a.status = 'active'
      ORDER BY a.code ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/accounts', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    // Validate account type
    const validTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    if (!validTypes.includes(req.body.type)) {
      return res.status(400).json({
        message: `Invalid account type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Create account with explicit field names
    const [result] = await Account.pool.execute(
      `INSERT INTO accounts (
        code,
        name,
        type,
        category,
        description,
        balance,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.code,
        req.body.name,
        req.body.type,
        req.body.category || '',
        req.body.description || '',
        req.body.balance || 0,
        req.body.status || 'active'
      ]
    );

    const [account] = await Account.pool.execute(
      'SELECT * FROM accounts WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(account[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Transaction routes
router.get('/transactions', protect, async (req, res) => {
  try {
    const [transactions] = await Transaction.pool.execute(`
      SELECT DISTINCT
        t.*,
        u.name as created_by_name,
        e.name as employee_name,
        e.id as employee_code,
        (
          SELECT CONCAT('[',
            GROUP_CONCAT(
              JSON_OBJECT(
                'account_id', te.account_id,
                'account_name', a.name,
                'debit', te.debit,
                'credit', te.credit,
                'description', te.description
              )
            ),
          ']')
          FROM transactions_entries te
          JOIN accounts a ON te.account_id = a.id
          WHERE te.transaction_id = t.id
        ) as entries
      FROM transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN employees e ON t.employee_id = e.id
      ORDER BY t.date DESC, t.id DESC
    `);

    // Parse the entries JSON string for each transaction
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      entries: transaction.entries ? JSON.parse(transaction.entries) : []
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/transactions/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.getWithDetails(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/transactions', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const transactionId = await Account.createTransaction({
      ...req.body,
      created_by: req.user.id
    });

    res.status(201).json({
      message: 'Transaction created successfully',
      transactionId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/transactions/:id/post', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    await Account.postTransaction(req.params.id);
    res.json({ message: 'Transaction posted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/transactions/:id', protect, async (req, res) => {
  const connection = await Transaction.pool.getConnection();
  try {
    await connection.beginTransaction();

    const transaction = await Transaction.getWithDetails(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update main transaction record
    await connection.execute(
      `UPDATE transactions
       SET date = ?, type = ?, category = ?, amount = ?,
           description = ?, reference = ?, employee_id = ?,
           notes = ?, payment_method = ?, status = ?
       WHERE id = ?`,
      [
        req.body.date,
        req.body.type,
        req.body.category,
        req.body.amount,
        req.body.description,
        req.body.reference,
        req.body.employee || null,
        req.body.notes,
        req.body.paymentMethod,
        req.body.status,
        req.params.id
      ]
    );

    // Update transaction entry
    await connection.execute(
      `UPDATE transactions_entries
       SET account_id = ?, description = ?,
           debit = ?, credit = ?
       WHERE transaction_id = ?`,
      [
        req.body.account,
        req.body.description,
        req.body.type === 'expense' || req.body.type === 'manufacturing_payment' || req.body.type === 'salary' ? req.body.amount : 0,
        req.body.type === 'revenue' || req.body.type === 'credit_payment' ? req.body.amount : 0,
        req.params.id
      ]
    );

    // If status changed to posted, update account balance
    if (req.body.status === 'posted' && transaction.status !== 'posted') {
      const balanceChange = req.body.type === 'revenue' || req.body.type === 'credit_payment' ? req.body.amount : -req.body.amount;
      await connection.execute(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [balanceChange, req.body.account]
      );
    }

    await connection.commit();

    const updatedTransaction = await Transaction.getWithDetails(req.params.id);
    res.json(updatedTransaction);

  } catch (error) {
    await connection.rollback();
    console.error('Error updating transaction:', error);
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

router.delete('/transactions/:id', protect, async (req, res) => {
  const connection = await Transaction.pool.getConnection();
  try {
    await connection.beginTransaction();

    const transaction = await Transaction.getWithDetails(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Delete transaction entries first
    await connection.execute(
      'DELETE FROM transactions_entries WHERE transaction_id = ?',
      [req.params.id]
    );

    // Then delete the main transaction
    await connection.execute(
      'DELETE FROM transactions WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: 'Transaction deleted successfully' });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// Get general ledger
router.get('/ledger/:accountId', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const entries = await Account.getLedgerEntries(
      req.params.accountId,
      startDate || '1970-01-01',
      endDate || new Date().toISOString().split('T')[0]
    );
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get cashbook entries
router.get('/cashbook', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const entries = await Account.getCashBook(
      startDate || '1970-01-01',
      endDate || new Date().toISOString().split('T')[0]
    );
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get trial balance
router.get('/trial-balance', protect, async (req, res) => {
  try {
    const trialBalance = await Account.getTrialBalance();
    res.json(trialBalance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get balance sheet
router.get('/balance-sheet', protect, async (req, res) => {
  try {
    const balanceSheet = await Account.getBalanceSheet();
    res.json(balanceSheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get income statement
router.get('/income-statement', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const incomeStatement = await Account.getIncomeStatement(
      startDate || '1970-01-01',
      endDate || new Date().toISOString().split('T')[0]
    );
    res.json(incomeStatement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get cash flow statement
router.get('/cash-flow', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const cashFlow = await Account.getCashFlow(
      startDate || '1970-01-01',
      endDate || new Date().toISOString().split('T')[0]
    );
    res.json(cashFlow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate financial statements
router.get('/reports/financial-statements', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get profit & loss data
    const profitLoss = await Account.getIncomeStatement(startDate, endDate);

    // Get balance sheet data
    const balanceSheet = await Account.getBalanceSheet();

    // Get trial balance
    const trialBalance = await Account.getTrialBalance();

    res.json({
      profitLoss,
      balanceSheet,
      trialBalance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add these export endpoints
router.post('/reports/:type/export', async (req, res) => {
  try {
    const { type } = req.params;
    const { data, format, dateRange } = req.body;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type);

    switch (type) {
      case 'trial-balance':
        // Set up trial balance columns
        worksheet.columns = [
          { header: 'Account Code', key: 'code', width: 15 },
          { header: 'Account Name', key: 'name', width: 30 },
          { header: 'Debit', key: 'debit', width: 15 },
          { header: 'Credit', key: 'credit', width: 15 }
        ];

        // Add data rows
        data.accounts?.forEach(account => {
          worksheet.addRow({
            code: account.code,
            name: account.name,
            debit: account.debit || 0,
            credit: account.credit || 0
          });
        });

        // Add total row
        worksheet.addRow({
          name: 'Total',
          debit: data.totalDebit || 0,
          credit: data.totalCredit || 0
        });
        break;

      case 'profit-loss':
        // Set up P&L sections
        worksheet.addRow(['Revenue']);
        worksheet.addRow(['Category', 'Amount']);
        data.revenue?.forEach(item => {
          worksheet.addRow([item.name, item.total || 0]);
        });
        worksheet.addRow(['Total Revenue', data.totalRevenue || 0]);

        worksheet.addRow([]);  // Empty row for spacing

        worksheet.addRow(['Expenses']);
        worksheet.addRow(['Category', 'Amount']);
        data.expenses?.forEach(item => {
          worksheet.addRow([item.name, item.total || 0]);
        });
        worksheet.addRow(['Total Expenses', data.totalExpenses || 0]);

        worksheet.addRow([]);
        worksheet.addRow(['Net Profit', data.netProfit || 0]);
        break;

      case 'balance-sheet':
        // Similar structure for balance sheet
        worksheet.addRow(['Assets']);
        worksheet.addRow(['Current Assets']);
        data.assets?.current?.forEach(item => {
          worksheet.addRow([item.name, item.total || 0]);
        });
        worksheet.addRow(['Total Current Assets', data.assets?.totalCurrent || 0]);

        worksheet.addRow([]);
        worksheet.addRow(['Fixed Assets']);
        // ... similar pattern for other sections
        break;

      case 'cash-flow':
        // Similar structure for cash flow
        worksheet.addRow(['Operating Activities']);
        // ... implement cash flow export format
        break;

      default:
        throw new Error('Unsupported report type');
    }

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${type}-report-${dateRange.startDate}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Error exporting report' });
  }
});

// Add this PUT endpoint for updating accounts
router.put('/accounts/:id', protect, authorize('admin', 'accountant'), async (req, res) => {
  const connection = await Account.pool.getConnection();
  try {
    // First check if account exists
    const [existingAccount] = await connection.execute(
      'SELECT * FROM accounts WHERE id = ?',
      [req.params.id]
    );

    if (existingAccount.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Validate account type
    const validTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    if (!validTypes.includes(req.body.type)) {
      return res.status(400).json({
        message: `Invalid account type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Update the account
    await connection.execute(
      `UPDATE accounts
       SET code = ?,
           name = ?,
           type = ?,
           category = ?,
           description = ?,
           balance = ?,
           status = ?
       WHERE id = ?`,
      [
        req.body.code,
        req.body.name,
        req.body.type,
        req.body.category || '',
        req.body.description || '',
        req.body.balance || 0,
        req.body.status || 'active',
        req.params.id
      ]
    );

    // Fetch the updated account
    const [updatedAccount] = await connection.execute(
      'SELECT * FROM accounts WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedAccount[0]);

  } catch (error) {
    console.error('Error updating account:', error);
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// Add this DELETE endpoint for accounts
router.delete('/accounts/:id', protect, authorize('admin', 'accountant'), async (req, res) => {
  const connection = await Account.pool.getConnection();
  try {
    // First check if account exists
    const [existingAccount] = await connection.execute(
      'SELECT * FROM accounts WHERE id = ?',
      [req.params.id]
    );

    if (existingAccount.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Check if account has any transactions
    const [transactions] = await connection.execute(
      'SELECT COUNT(*) as count FROM transactions_entries WHERE account_id = ?',
      [req.params.id]
    );

    if (transactions[0].count > 0) {
      return res.status(400).json({
        message: 'Cannot delete account with existing transactions. Consider deactivating it instead.'
      });
    }

    // Delete the account
    await connection.execute(
      'DELETE FROM accounts WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// Add this new route to get accounting summary
router.get('/summary', protect, async (req, res) => {
  try {
    const connection = await Account.pool.getConnection();

    try {
      // Get total assets
      const [assets] = await connection.execute(`
        SELECT SUM(balance) as total
        FROM accounts
        WHERE type = 'asset' AND status = 'active'
      `);

      // Get total liabilities
      const [liabilities] = await connection.execute(`
        SELECT SUM(balance) as total
        FROM accounts
        WHERE type = 'liability' AND status = 'active'
      `);

      // Get total equity
      const [equity] = await connection.execute(`
        SELECT SUM(balance) as total
        FROM accounts
        WHERE type = 'equity' AND status = 'active'
      `);

      // Get current month revenue
      const [revenue] = await connection.execute(`
        SELECT SUM(CASE
          WHEN te.credit > te.debit THEN te.credit - te.debit
          ELSE 0
        END) as total
        FROM accounts a
        JOIN transactions_entries te ON a.id = te.account_id
        JOIN transactions t ON te.transaction_id = t.id
        WHERE a.type = 'revenue'
        AND t.status = 'posted'
        AND MONTH(t.date) = MONTH(CURRENT_DATE())
        AND YEAR(t.date) = YEAR(CURRENT_DATE())
      `);

      // Get current month expenses
      const [expenses] = await connection.execute(`
        SELECT SUM(CASE
          WHEN te.debit > te.credit THEN te.debit - te.credit
          ELSE 0
        END) as total
        FROM accounts a
        JOIN transactions_entries te ON a.id = te.account_id
        JOIN transactions t ON te.transaction_id = t.id
        WHERE a.type = 'expense'
        AND t.status = 'posted'
        AND MONTH(t.date) = MONTH(CURRENT_DATE())
        AND YEAR(t.date) = YEAR(CURRENT_DATE())
      `);

      // Get cash balance
      const [cash] = await connection.execute(`
        SELECT SUM(balance) as total
        FROM accounts
        WHERE code LIKE '1001%' AND status = 'active'
      `);

      // Get accounts receivable
      const [receivables] = await connection.execute(`
        SELECT SUM(balance) as total
        FROM accounts
        WHERE code LIKE '1002%' AND status = 'active'
      `);

      // Get accounts payable
      const [payables] = await connection.execute(`
        SELECT SUM(balance) as total
        FROM accounts
        WHERE code LIKE '2001%' AND status = 'active'
      `);

      // Calculate net income
      const netIncome = (revenue[0].total || 0) - (expenses[0].total || 0);

      res.json({
        assets: assets[0].total || 0,
        liabilities: liabilities[0].total || 0,
        equity: equity[0].total || 0,
        currentMonthRevenue: revenue[0].total || 0,
        currentMonthExpenses: expenses[0].total || 0,
        currentMonthNetIncome: netIncome,
        cashBalance: cash[0].total || 0,
        accountsReceivable: receivables[0].total || 0,
        accountsPayable: payables[0].total || 0,
        quickRatio: ((cash[0].total || 0) + (receivables[0].total || 0)) / (payables[0].total || 1),
        currentRatio: (assets[0].total || 0) / (liabilities[0].total || 1),
        debtToEquityRatio: (liabilities[0].total || 0) / (equity[0].total || 1)
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting accounting summary:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;