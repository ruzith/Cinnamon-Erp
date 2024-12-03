const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// Account routes
router.get('/accounts', protect, async (req, res) => {
  try {
    const accounts = await Account.find({ status: 'active' }).sort('code');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/accounts', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const account = await Account.create(req.body);
    res.status(201).json(account);
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

// Get accounting summary
router.get('/summary', protect, async (req, res) => {
  try {
    const accounts = await Account.find({ status: 'active' });
    
    const summary = {
      assets: {
        total: 0,
        currentAssets: 0,
        fixedAssets: 0
      },
      liabilities: {
        total: 0,
        currentLiabilities: 0,
        longTermLiabilities: 0
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
        debtToEquity: 0,
        quickRatio: 0
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
    
    // Build query
    const query = {};
    
    // Add date range if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add status if provided
    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate('entries.account')
      .populate('createdBy', 'name')
      .sort('-date');
      
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 