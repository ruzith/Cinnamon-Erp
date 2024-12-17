const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { authorize } = require('../middleware/authMiddleware');

let ExcelJS, PDFDocument, moment;
try {
  ExcelJS = require('exceljs');
  PDFDocument = require('pdfkit');
  moment = require('moment');
} catch (error) {
  console.warn('Warning: Some report generation features may be unavailable');
}

// Get available reports
router.get('/templates', protect, authorize('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const reports = await Report.getActiveReports();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate report
router.post('/generate/:code', protect, async (req, res) => {
  try {
    const report = await Report.findByCode(req.params.code);
    if (!report) {
      return res.status(404).json({ message: 'Report template not found' });
    }

    // Execute the report query with parameters
    const [results] = await Report.pool.execute(report.query, req.body.params || []);

    // Format output based on requested format
    switch (req.query.format) {
      case 'excel':
        if (!ExcelJS) {
          throw new Error('Excel export is not available');
        }
        // Excel generation logic
        break;

      case 'pdf':
        if (!PDFDocument) {
          throw new Error('PDF export is not available');
        }
        // PDF generation logic
        break;

      default:
        res.json(results);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get financial reports
router.get('/', protect, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Report type, start date, and end date are required' 
      });
    }

    switch (type) {
      case 'financial': {
        // Get transactions within date range
        const [transactions] = await Transaction.pool.execute(`
          SELECT t.*, 
                 te.account_id,
                 te.debit,
                 te.credit,
                 a.type as account_type,
                 a.category as account_category
          FROM transactions t
          JOIN transactions_entries te ON t.id = te.transaction_id
          JOIN accounts a ON te.account_id = a.id
          WHERE t.status = 'posted'
            AND t.date BETWEEN ? AND ?
        `, [startDate, endDate]);

        // Get current account balances
        const [accounts] = await Account.pool.execute(
          'SELECT * FROM accounts WHERE status = "active"'
        );

        const report = {
          period: { startDate, endDate },
          profitLoss: {
            revenue: 0,
            expenses: 0,
            netProfit: 0
          },
          balanceSheet: {
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
          },
          cashFlow: {
            operating: 0,
            investing: 0,
            financing: 0,
            netCashFlow: 0
          },
          ratios: {
            currentRatio: 0,
            quickRatio: 0,
            debtToEquity: 0,
            returnOnAssets: 0,
            returnOnEquity: 0
          }
        };

        // Calculate financial metrics
        transactions.forEach(entry => {
          // Add calculations here based on entry.account_type and entry.account_category
        });

        accounts.forEach(account => {
          // Add balance sheet calculations here
        });

        res.json(report);
        break;
      }
      default:
        res.status(400).json({ message: 'Invalid report type' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 