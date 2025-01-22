const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Account = require('../models/domain/Account');
const Transaction = require('../models/domain/Transaction');
const ExcelJS = require('exceljs');
const dayjs = require('dayjs');

// Account routes
router.get('/accounts', protect, async (req, res) => {
  try {
    let query = 'SELECT * FROM accounts';
    const params = [];

    if (req.query.code) {
      query += ' WHERE code = ?';
      params.push(req.query.code);
    }

    query += ' ORDER BY code ASC';

    const [rows] = await Account.pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
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

router.delete('/transactions/:id', protect, async (req, res) => {
  const connection = await Transaction.pool.getConnection();
  try {
    await connection.beginTransaction();

    // First check if transaction exists and is unposted
    const [transaction] = await connection.execute(
      'SELECT * FROM transactions WHERE id = ?',
      [req.params.id]
    );

    if (!transaction[0]) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction[0].status !== 'draft') {
      return res.status(400).json({
        message: 'Only unposted transactions can be deleted'
      });
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
    console.error('Error deleting transaction:', error);
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
    const cashbook = await Account.getCashBook(
      startDate || '1970-01-01',
      endDate || new Date().toISOString().split('T')[0]
    );
    res.json(cashbook);
  } catch (error) {
    console.error('Error fetching cashbook:', error);
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
    const { startDate, endDate } = req.query;
    const balanceSheet = await Account.getBalanceSheet(startDate, endDate);
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
router.get('/reports/cash-flow', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const connection = await Account.pool.getConnection();

    try {
      // Start with zero balance
      const openingBalance = 0;

      // Get all transactions including and before the start date for cash accounts
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
          a.code LIKE '1001%'
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

      // Get cash flow activities for the period
      const [activities] = await connection.execute(`
        SELECT
          a.type,
          a.category,
          a.name,
          te.transaction_id,
          t.date,
          t.description,
          SUM(CASE
            WHEN te.debit > 0 THEN te.debit
            ELSE -te.credit
          END) as amount
        FROM accounts a
        JOIN transactions_entries te ON a.id = te.account_id
        JOIN transactions t ON te.transaction_id = t.id
        WHERE t.status = 'posted'
          AND t.date BETWEEN ? AND ?
        GROUP BY a.type, a.category, a.name, te.transaction_id, t.date, t.description
        ORDER BY t.date
      `, [startDate, endDate]);

      // Process the data into a structured format
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
        openingBalance: actualOpeningBalance,
        netCashFlow: 0,
        closingBalance: 0
      };

      // Categorize activities
      activities.forEach(activity => {
        const amount = parseFloat(activity.amount);
        const flowItem = {
          date: activity.date,
          description: activity.description,
          amount: Math.abs(amount)
        };

        switch(activity.type) {
          case 'revenue':
            cashFlow.operating.inflows.push(flowItem);
            cashFlow.operating.total += amount;
            break;
          case 'expense':
            cashFlow.operating.outflows.push(flowItem);
            cashFlow.operating.total -= Math.abs(amount);
            break;
          case 'asset':
            if (activity.category === 'fixed') {
              if (amount < 0) {
                cashFlow.investing.outflows.push(flowItem);
                cashFlow.investing.total -= Math.abs(amount);
              } else {
                cashFlow.investing.inflows.push(flowItem);
                cashFlow.investing.total += amount;
              }
            }
            break;
          case 'liability':
          case 'equity':
            if (amount < 0) {
              cashFlow.financing.outflows.push(flowItem);
              cashFlow.financing.total -= Math.abs(amount);
            } else {
              cashFlow.financing.inflows.push(flowItem);
              cashFlow.financing.total += amount;
            }
            break;
        }
      });

      // Calculate net cash flow and closing balance
      cashFlow.netCashFlow =
        cashFlow.operating.total +
        cashFlow.investing.total +
        cashFlow.financing.total;

      cashFlow.closingBalance = cashFlow.openingBalance + cashFlow.netCashFlow;

      res.json(cashFlow);

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error generating cash flow statement:', error);
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

// Common headers with dynamic column merging
const getMergedCellRange = (type) => {
  switch (type) {
    case 'balance-sheet':
      return 'A1:B1';
    case 'profit-loss':
      return 'A1:C1';
    default:
      return 'A1:D1';
  }
};

// Add these export endpoints
router.post('/reports/:type/export', protect, async (req, res) => {
  try {
    const { type } = req.params;
    const { data, dateRange } = req.body;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '));

    // Common styling
    const headerStyle = {
      font: { bold: true, size: 12 },
      alignment: { horizontal: 'center' }
    };

    const subHeaderStyle = {
      font: { size: 10 },
      alignment: { horizontal: 'center' }
    };

    const sectionHeaderStyle = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
    };

    // Add title and date range
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    worksheet.getCell('A1').style = headerStyle;

    worksheet.mergeCells('A2:D2');
    worksheet.getCell('A2').value = `Period: ${dateRange.startDate} to ${dateRange.endDate}`;
    worksheet.getCell('A2').style = subHeaderStyle;

    worksheet.addRow([]); // Empty row for spacing

    switch (type) {
      case 'trial-balance': {
        // Set columns with proper headers
        worksheet.columns = [
          { header: 'Account Code', key: 'code', width: 15 },
          { header: 'Account Name', key: 'name', width: 40 },
          { header: 'Debit', key: 'debit', width: 15 },
          { header: 'Credit', key: 'credit', width: 15 }
        ];

        // Add header row after spacing
        const headerRow = worksheet.addRow(['Account Code', 'Account Name', 'Debit', 'Credit']);
        headerRow.font = { bold: true };

        // Add data rows
        data.accounts?.forEach(account => {
          worksheet.addRow({
            code: account.code,
            name: account.name,
            debit: account.debit > 0 ? account.debit : null,
            credit: account.credit > 0 ? account.credit : null
          });
        });

        // Add total row
        const totalRow = worksheet.addRow({
          code: '',
          name: 'Total',
          debit: data.totalDebit || 0,
          credit: data.totalCredit || 0
        });
        totalRow.font = { bold: true };
        totalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F5F5' }
        };

        // Format all number cells
        worksheet.getColumn(3).numFmt = '#,##0.00';
        worksheet.getColumn(4).numFmt = '#,##0.00';

        // Align numbers to right
        worksheet.getColumn(3).alignment = { horizontal: 'right' };
        worksheet.getColumn(4).alignment = { horizontal: 'right' };

        break;
      }

      case 'balance-sheet': {
        // Set columns with proper headers
        worksheet.columns = [
          { header: 'Account', key: 'name', width: 40 },
          { header: 'Amount', key: 'amount', width: 15 }
        ];

        // Add header row after spacing
        const headerRow = worksheet.addRow(['Account', 'Amount']);
        headerRow.font = { bold: true };

        // Assets section
        worksheet.addRow(['ASSETS']).font = { bold: true };
        data.assets?.current?.forEach(asset => {
          worksheet.addRow([asset.name, Math.abs(asset.balance || 0)]);
        });
        const assetTotalRow = worksheet.addRow(['Total Assets', Math.abs(data.assets?.total || 0)]);
        assetTotalRow.font = { bold: true };
        assetTotalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F5F5' }
        };

        worksheet.addRow([]); // Spacing

        // Liabilities section
        worksheet.addRow(['LIABILITIES']).font = { bold: true };
        data.liabilities?.current?.forEach(liability => {
          worksheet.addRow([liability.name, Math.abs(liability.balance || 0)]);
        });
        const liabTotalRow = worksheet.addRow(['Total Liabilities', Math.abs(data.liabilities?.total || 0)]);
        liabTotalRow.font = { bold: true };
        liabTotalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F5F5' }
        };

        worksheet.addRow([]); // Spacing

        // Net Position
        const netPositionRow = worksheet.addRow([
          'Net Position',
          Math.abs((data.assets?.total || 0) - (data.liabilities?.total || 0))
        ]);
        netPositionRow.font = { bold: true };
        netPositionRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E0E0E0' }
        };

        // Format numbers and alignment
        worksheet.getColumn(2).numFmt = '#,##0.00';
        worksheet.getColumn(2).alignment = { horizontal: 'right' };
        break;
      }

      case 'profit-loss': {
        // Set columns with proper headers
        worksheet.columns = [
          { header: 'Account', key: 'name', width: 40 },
          { header: 'Category', key: 'category', width: 20 },
          { header: 'Amount', key: 'amount', width: 15 }
        ];

        // Add header row after spacing
        const headerRow = worksheet.addRow(['Account', 'Category', 'Amount']);
        headerRow.font = { bold: true };

        // Revenue section
        worksheet.addRow(['REVENUE']).font = { bold: true };
        data.revenue?.forEach(item => {
          worksheet.addRow([item.name, item.category, item.amount || 0]);
        });
        const revenueTotalRow = worksheet.addRow(['Total Revenue', '', data.totalRevenue || 0]);
        revenueTotalRow.font = { bold: true };
        revenueTotalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F5F5' }
        };

        worksheet.addRow([]); // Spacing

        // Expenses section
        worksheet.addRow(['EXPENSES']).font = { bold: true };
        data.expenses?.forEach(item => {
          worksheet.addRow([item.name, item.category, item.amount || 0]);
        });
        const expenseTotalRow = worksheet.addRow(['Total Expenses', '', data.totalExpenses || 0]);
        expenseTotalRow.font = { bold: true };
        expenseTotalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F5F5' }
        };

        worksheet.addRow([]); // Spacing

        // Net Income/Loss
        const netIncomeRow = worksheet.addRow(['Net Income/Loss', '', data.netIncome || 0]);
        netIncomeRow.font = { bold: true };
        netIncomeRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E0E0E0' }
        };

        // Format numbers and alignment
        worksheet.getColumn(3).numFmt = '#,##0.00';
        worksheet.getColumn(3).alignment = { horizontal: 'right' };
        break;
      }

      case 'cash-flow': {
        // Set columns with proper headers
        worksheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Description', key: 'description', width: 40 },
          { header: 'Inflow', key: 'inflow', width: 15 },
          { header: 'Outflow', key: 'outflow', width: 15 }
        ];

        // Add header row after spacing
        const headerRow = worksheet.addRow(['Date', 'Description', 'Inflow', 'Outflow']);
        headerRow.font = { bold: true };

        // Opening balance
        const openingRow = worksheet.addRow(['', 'Opening Balance', data.openingBalance || 0, '']);
        openingRow.font = { bold: true };
        openingRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F5F5' }
        };

        worksheet.addRow([]); // Spacing

        // Cash movements
        worksheet.addRow(['CASH MOVEMENTS']).font = { bold: true };
        data.operating?.inflows?.forEach(item => {
          worksheet.addRow([
            dayjs(item.date).format('YYYY-MM-DD'),
            item.description,
            item.amount || 0,
            ''
          ]);
        });
        data.operating?.outflows?.forEach(item => {
          worksheet.addRow([
            dayjs(item.date).format('YYYY-MM-DD'),
            item.description,
            '',
            item.amount || 0
          ]);
        });

        // Net movement
        const netMovementRow = worksheet.addRow([
          '',
          'Net Cash Movement',
          data.operating?.total >= 0 ? data.operating?.total : '',
          data.operating?.total < 0 ? Math.abs(data.operating?.total) : ''
        ]);
        netMovementRow.font = { bold: true };
        netMovementRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F5F5' }
        };

        worksheet.addRow([]); // Spacing

        // Summary
        const netFlowRow = worksheet.addRow([
          '',
          'Net Cash Flow',
          data.netCashFlow >= 0 ? data.netCashFlow : '',
          data.netCashFlow < 0 ? Math.abs(data.netCashFlow) : ''
        ]);
        netFlowRow.font = { bold: true };
        netFlowRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E0E0E0' }
        };

        const closingRow = worksheet.addRow(['', 'Closing Balance', data.closingBalance || 0, '']);
        closingRow.font = { bold: true };
        closingRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E0E0E0' }
        };

        // Format numbers and alignment
        worksheet.getColumn(3).numFmt = '#,##0.00';
        worksheet.getColumn(4).numFmt = '#,##0.00';
        worksheet.getColumn(3).alignment = { horizontal: 'right' };
        worksheet.getColumn(4).alignment = { horizontal: 'right' };
        break;
      }
    }

    // Format numbers in the entire worksheet
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0.00';
        }
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${type}-${dateRange.startDate}.xlsx`
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

// Add these new report endpoints
router.get('/reports/trial-balance', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const [accounts] = await Account.pool.execute(`
      SELECT
        code,
        name,
        type,
        category,
        balance
      FROM accounts
      WHERE status = 'active'
      ORDER BY code ASC
    `);

    // Process the accounts to calculate debit and credit balances
    const processedAccounts = accounts.map(account => {
      const balance = parseFloat(account.balance);
      return {
        code: account.code,
        name: account.name,
        type: account.type,
        debit: balance > 0 ? Math.abs(balance) : 0,
        credit: balance < 0 ? Math.abs(balance) : 0
      };
    });

    // Calculate totals
    const totals = processedAccounts.reduce((acc, account) => {
      return {
        totalDebit: acc.totalDebit + account.debit,
        totalCredit: acc.totalCredit + account.credit
      };
    }, { totalDebit: 0, totalCredit: 0 });

    res.json({
      accounts: processedAccounts,
      totalDebit: totals.totalDebit,
      totalCredit: totals.totalCredit,
      isBalanced: Math.abs(totals.totalDebit - totals.totalCredit) < 0.01 // Check if balanced within rounding error
    });

  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/reports/balance-sheet', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get detailed account balances - only current assets and liabilities
    const [accounts] = await Account.pool.execute(`
      SELECT
        type,
        category,
        SUM(balance) as total,
        GROUP_CONCAT(JSON_OBJECT(
          'name', name,
          'balance', balance
        )) as details
      FROM accounts
      WHERE status = 'active'
        AND ((type = 'asset' AND category = 'current')
          OR (type = 'liability' AND category = 'current-liability'))
      GROUP BY type, category
      ORDER BY type, category
    `);

    // Process the data into a simplified format
    const balanceSheet = {
      assets: {
        current: [],
        totalCurrent: 0,
        total: 0
      },
      liabilities: {
        current: [],
        totalCurrent: 0,
        total: 0
      }
    };

    accounts.forEach(account => {
      const total = parseFloat(account.total) || 0;
      const details = JSON.parse(`[${account.details}]`);

      switch (account.type) {
        case 'asset':
          balanceSheet.assets.current.push(...details);
          balanceSheet.assets.totalCurrent += total;
          balanceSheet.assets.total += total;
          break;

        case 'liability':
          balanceSheet.liabilities.current.push(...details);
          balanceSheet.liabilities.totalCurrent += total;
          balanceSheet.liabilities.total += total;
          break;
      }
    });

    res.json(balanceSheet);

  } catch (error) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/reports/profit-loss', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get revenue and expense details
    const [accounts] = await Account.pool.execute(`
      SELECT
        type,
        category,
        name,
        SUM(balance) as amount
      FROM accounts
      WHERE status = 'active'
        AND type IN ('revenue', 'expense')
      GROUP BY type, category, name
      ORDER BY type DESC, category, name
    `);

    // Process the data into a structured format
    const profitLoss = {
      revenue: [],
      expenses: [],
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0
    };

    accounts.forEach(account => {
      const amount = Math.abs(parseFloat(account.amount) || 0);

      if (account.type === 'revenue') {
        profitLoss.revenue.push({
          name: account.name,
          category: account.category,
          amount: amount
        });
        profitLoss.totalRevenue += amount;
      } else if (account.type === 'expense') {
        profitLoss.expenses.push({
          name: account.name,
          category: account.category,
          amount: amount
        });
        profitLoss.totalExpenses += amount;
      }
    });

    // Calculate net income
    profitLoss.netIncome = profitLoss.totalRevenue - profitLoss.totalExpenses;

    res.json(profitLoss);

  } catch (error) {
    console.error('Error generating profit & loss statement:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;