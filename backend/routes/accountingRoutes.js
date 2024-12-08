const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

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
    const [result] = await Account.pool.execute(
      'INSERT INTO accounts SET ?',
      [req.body]
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
router.post('/transactions', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      createdBy: req.user.id
    });

    // If transaction is posted, update account balances
    if (req.body.status === 'posted') {
      for (const entry of transaction.entries) {
        const account = await Account.findById(entry.account);
        if (!account) {
          return res.status(404).json({ message: `Account not found: ${entry.account}` });
        }

        // Update account balance
        const balanceChange = entry.debit - entry.credit;
        if (['asset', 'expense'].includes(account.type)) {
          account.balance += balanceChange;
        } else {
          account.balance -= balanceChange;
        }
        await account.save();
      }
    }

    await transaction.save();
    res.status(201).json(
      await transaction
        .populate('entries.account')
        .populate('createdBy', 'name')
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Generate trial balance
router.get('/reports/trial-balance', protect, async (req, res) => {
  try {
    const accounts = await Account.find({ status: 'active' }).sort('code');
    const trialBalance = {
      totalDebit: 0,
      totalCredit: 0,
      accounts: accounts.map(account => {
        const balance = account.balance;
        const debit = balance > 0 ? balance : 0;
        const credit = balance < 0 ? -balance : 0;
        
        return {
          code: account.code,
          name: account.name,
          type: account.type,
          debit,
          credit
        };
      })
    };

    trialBalance.totalDebit = trialBalance.accounts.reduce((sum, acc) => sum + acc.debit, 0);
    trialBalance.totalCredit = trialBalance.accounts.reduce((sum, acc) => sum + acc.credit, 0);

    res.json(trialBalance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate profit and loss statement
router.get('/reports/profit-loss', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      status: 'posted',
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    const transactions = await Transaction.find(query).populate('entries.account');
    
    const report = {
      revenue: [],
      expenses: [],
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0
    };

    transactions.forEach(transaction => {
      transaction.entries.forEach(entry => {
        if (entry.account.type === 'revenue') {
          report.totalRevenue += entry.credit - entry.debit;
        } else if (entry.account.type === 'expense') {
          report.totalExpenses += entry.debit - entry.credit;
        }
      });
    });

    report.netProfit = report.totalRevenue - report.totalExpenses;
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate balance sheet
router.get('/reports/balance-sheet', protect, async (req, res) => {
  try {
    const accounts = await Account.find({ status: 'active' });
    
    const balanceSheet = {
      assets: {
        current: [],
        fixed: [],
        totalCurrent: 0,
        totalFixed: 0,
        total: 0
      },
      liabilities: {
        current: [],
        longTerm: [],
        totalCurrent: 0,
        totalLongTerm: 0,
        total: 0
      },
      equity: {
        items: [],
        total: 0
      }
    };

    accounts.forEach(account => {
      const item = {
        code: account.code,
        name: account.name,
        balance: Math.abs(account.balance)
      };

      if (account.type === 'asset') {
        if (account.category === 'current') {
          balanceSheet.assets.current.push(item);
          balanceSheet.assets.totalCurrent += account.balance;
        } else {
          balanceSheet.assets.fixed.push(item);
          balanceSheet.assets.totalFixed += account.balance;
        }
      } else if (account.type === 'liability') {
        if (account.category === 'current-liability') {
          balanceSheet.liabilities.current.push(item);
          balanceSheet.liabilities.totalCurrent += account.balance;
        } else {
          balanceSheet.liabilities.longTerm.push(item);
          balanceSheet.liabilities.totalLongTerm += account.balance;
        }
      } else if (account.type === 'equity') {
        balanceSheet.equity.items.push(item);
        balanceSheet.equity.total += account.balance;
      }
    });

    balanceSheet.assets.total = balanceSheet.assets.totalCurrent + balanceSheet.assets.totalFixed;
    balanceSheet.liabilities.total = balanceSheet.liabilities.totalCurrent + balanceSheet.liabilities.totalLongTerm;

    res.json(balanceSheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get financial summary
router.get('/summary', protect, async (req, res) => {
  try {
    // Get all active accounts with their balances
    const [accounts] = await Account.pool.execute(`
      SELECT *
      FROM accounts
      WHERE status = 'active'
      ORDER BY type, category
    `);

    const summary = {
      assets: {
        currentAssets: 0,
        fixedAssets: 0,
        total: 0
      },
      liabilities: {
        currentLiabilities: 0,
        longTermLiabilities: 0,
        total: 0
      },
      equity: {
        total: 0
      },
      profitLoss: {
        revenue: 0,
        expenses: 0,
        netProfit: 0
      },
      ratios: {
        currentRatio: 0,
        quickRatio: 0,
        debtToEquity: 0
      }
    };

    // Calculate totals
    accounts.forEach(account => {
      const balance = Math.abs(account.balance);
      
      switch(account.type) {
        case 'asset':
          summary.assets.total += balance;
          if (account.category === 'current') {
            summary.assets.currentAssets += balance;
          } else {
            summary.assets.fixedAssets += balance;
          }
          break;
        case 'liability':
          summary.liabilities.total += balance;
          if (account.category === 'current-liability') {
            summary.liabilities.currentLiabilities += balance;
          } else {
            summary.liabilities.longTermLiabilities += balance;
          }
          break;
        case 'equity':
          summary.equity.total += balance;
          break;
        case 'revenue':
          summary.profitLoss.revenue += balance;
          break;
        case 'expense':
          summary.profitLoss.expenses += balance;
          break;
      }
    });

    // Calculate net profit
    summary.profitLoss.netProfit = summary.profitLoss.revenue - summary.profitLoss.expenses;

    // Calculate financial ratios
    summary.ratios.currentRatio = summary.liabilities.currentLiabilities !== 0 
      ? summary.assets.currentAssets / summary.liabilities.currentLiabilities 
      : 0;
    
    summary.ratios.debtToEquity = summary.equity.total !== 0 
      ? summary.liabilities.total / summary.equity.total 
      : 0;
    
    const quickAssets = summary.assets.currentAssets; // Simplified - should exclude inventory
    summary.ratios.quickRatio = summary.liabilities.currentLiabilities !== 0 
      ? quickAssets / summary.liabilities.currentLiabilities 
      : 0;

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions
router.get('/transactions', protect, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build query conditions
    let conditions = [];
    let params = [];
    
    if (startDate && endDate) {
      conditions.push('t.date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }
    
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    const [rows] = await Transaction.pool.execute(`
      SELECT t.*,
             w.name as well_name,
             l.name as lease_name,
             u.name as created_by_name
      FROM transactions t
      JOIN wells w ON t.well_id = w.id
      JOIN leases l ON t.lease_id = l.id
      LEFT JOIN users u ON t.created_by = u.id
      ${whereClause}
      ORDER BY t.date DESC
    `, params);

    // Get entries for each transaction
    const transactions = await Promise.all(rows.map(async (transaction) => {
      const [entries] = await Transaction.pool.execute(`
        SELECT te.*,
               a.code as account_code,
               a.name as account_name,
               a.type as account_type
        FROM transactions_entries te
        JOIN accounts a ON te.account_id = a.id
        WHERE te.transaction_id = ?
        ORDER BY te.id ASC
      `, [transaction.id]);

      return {
        ...transaction,
        entries
      };
    }));
      
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 