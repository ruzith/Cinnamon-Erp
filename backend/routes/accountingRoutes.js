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
    // Get all active accounts with their balances using MySQL syntax
    const [accounts] = await Account.pool.execute(`
      SELECT 
        code,
        name,
        type,
        balance
      FROM accounts 
      WHERE status = 'active'
      ORDER BY code
    `);

    const trialBalance = {
      totalDebit: 0,
      totalCredit: 0,
      accounts: accounts.map(account => {
        const balance = Number(account.balance);
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

    // Calculate totals
    trialBalance.totalDebit = trialBalance.accounts.reduce((sum, acc) => sum + acc.debit, 0);
    trialBalance.totalCredit = trialBalance.accounts.reduce((sum, acc) => sum + acc.credit, 0);

    res.json(trialBalance);
  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate profit and loss statement
router.get('/reports/profit-loss', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get all transactions with their entries using MySQL syntax
    const [transactions] = await Transaction.pool.execute(`
      SELECT 
        t.id,
        t.date,
        te.debit,
        te.credit,
        a.type as account_type,
        a.name as account_name,
        a.code as account_code
      FROM transactions t
      JOIN transactions_entries te ON t.id = te.transaction_id
      JOIN accounts a ON te.account_id = a.id
      WHERE t.status = 'posted'
        AND t.date BETWEEN ? AND ?
        AND a.type IN ('revenue', 'expense')
      ORDER BY t.date, t.id
    `, [startDate, endDate]);
    
    const report = {
      revenue: [],
      expenses: [],
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0
    };

    // Group transactions by account
    const accountSummary = transactions.reduce((acc, trans) => {
      const key = `${trans.account_type}-${trans.account_code}`;
      if (!acc[key]) {
        acc[key] = {
          code: trans.account_code,
          name: trans.account_name,
          type: trans.account_type,
          total: 0
        };
      }
      
      if (trans.account_type === 'revenue') {
        acc[key].total += trans.credit - trans.debit;
      } else if (trans.account_type === 'expense') {
        acc[key].total += trans.debit - trans.credit;
      }
      
      return acc;
    }, {});

    // Populate report arrays and calculate totals
    Object.values(accountSummary).forEach(account => {
      if (account.type === 'revenue') {
        report.revenue.push(account);
        report.totalRevenue += account.total;
      } else if (account.type === 'expense') {
        report.expenses.push(account);
        report.totalExpenses += account.total;
      }
    });

    report.netProfit = report.totalRevenue - report.totalExpenses;
    res.json(report);
  } catch (error) {
    console.error('Error generating profit & loss:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate balance sheet
router.get('/reports/balance-sheet', protect, async (req, res) => {
  try {
    // Get all active accounts with their balances using MySQL syntax
    const [accounts] = await Account.pool.execute(`
      SELECT 
        code,
        name,
        type,
        category,
        balance
      FROM accounts 
      WHERE status = 'active'
        AND type IN ('asset', 'liability', 'equity')
      ORDER BY code
    `);
    
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
        balance: Math.abs(Number(account.balance))
      };

      switch (account.type) {
        case 'asset':
          if (account.category === 'current') {
            balanceSheet.assets.current.push(item);
            balanceSheet.assets.totalCurrent += item.balance;
          } else {
            balanceSheet.assets.fixed.push(item);
            balanceSheet.assets.totalFixed += item.balance;
          }
          break;
          
        case 'liability':
          if (account.category === 'current') {
            balanceSheet.liabilities.current.push(item);
            balanceSheet.liabilities.totalCurrent += item.balance;
          } else {
            balanceSheet.liabilities.longTerm.push(item);
            balanceSheet.liabilities.totalLongTerm += item.balance;
          }
          break;
          
        case 'equity':
          balanceSheet.equity.items.push(item);
          balanceSheet.equity.total += item.balance;
          break;
      }
    });

    // Calculate totals
    balanceSheet.assets.total = balanceSheet.assets.totalCurrent + balanceSheet.assets.totalFixed;
    balanceSheet.liabilities.total = balanceSheet.liabilities.totalCurrent + balanceSheet.liabilities.totalLongTerm;

    res.json(balanceSheet);
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate cash flow statement
router.get('/reports/cash-flow', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get all cash-related transactions
    const [transactions] = await Transaction.pool.execute(`
      SELECT 
        t.id,
        t.date,
        t.type as transaction_type,
        te.debit,
        te.credit,
        a.type as account_type,
        a.category as account_category
      FROM transactions t
      JOIN transactions_entries te ON t.id = te.transaction_id
      JOIN accounts a ON te.account_id = a.id
      WHERE t.status = 'posted'
        AND t.date BETWEEN ? AND ?
      ORDER BY t.date, t.id
    `, [startDate, endDate]);

    const cashFlow = {
      operating: {
        inflows: [],
        outflows: [],
        total: 0
      },
      investing: {
        inflows: [],
        outflows: [],
        total: 0
      },
      financing: {
        inflows: [],
        outflows: [],
        total: 0
      },
      netCashFlow: 0
    };

    transactions.forEach(trans => {
      const amount = trans.debit - trans.credit;
      
      // Categorize cash flows
      if (['revenue', 'expense'].includes(trans.account_type)) {
        if (amount > 0) {
          cashFlow.operating.outflows.push(trans);
          cashFlow.operating.total -= amount;
        } else {
          cashFlow.operating.inflows.push(trans);
          cashFlow.operating.total -= amount;
        }
      } else if (trans.account_category === 'fixed') {
        if (amount > 0) {
          cashFlow.investing.outflows.push(trans);
          cashFlow.investing.total -= amount;
        } else {
          cashFlow.investing.inflows.push(trans);
          cashFlow.investing.total -= amount;
        }
      } else if (['liability', 'equity'].includes(trans.account_type)) {
        if (amount > 0) {
          cashFlow.financing.outflows.push(trans);
          cashFlow.financing.total -= amount;
        } else {
          cashFlow.financing.inflows.push(trans);
          cashFlow.financing.total -= amount;
        }
      }
    });

    // Calculate net cash flow
    cashFlow.netCashFlow = 
      cashFlow.operating.total + 
      cashFlow.investing.total + 
      cashFlow.financing.total;

    res.json(cashFlow);
  } catch (error) {
    console.error('Error generating cash flow statement:', error);
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

// Get ledger entries for an account
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

module.exports = router; 