const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Report = require('../models/Report');
const mongoose = require('mongoose');
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
    const reports = await Report.find({ status: 'active' })
      .select('code name category description');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate report
router.post('/generate/:code', protect, authorize('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const report = await Report.findOne({ code: req.params.code, status: 'active' });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const { filters, format = 'json', language = 'en' } = req.body;

    // Parse and execute the query
    let pipeline = JSON.parse(report.query);
    
    // Apply filters
    if (filters) {
      pipeline = applyFilters(pipeline, filters);
    }

    // Execute the aggregation
    const Model = mongoose.model(getModelNameFromCategory(report.category));
    const data = await Model.aggregate(pipeline);

    // Format response based on requested format
    switch (format.toLowerCase()) {
      case 'excel':
        if (!ExcelJS) {
          return res.status(400).json({ message: 'Excel export is not available' });
        }
        const workbook = await generateExcel(data, report, language);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${report.code}_${moment().format('YYYYMMDD')}.xlsx`);
        await workbook.xlsx.write(res);
        break;

      case 'pdf':
        if (!PDFDocument) {
          return res.status(400).json({ message: 'PDF export is not available' });
        }
        const pdfDoc = await generatePDF(data, report, language);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${report.code}_${moment().format('YYYYMMDD')}.pdf`);
        pdfDoc.pipe(res);
        pdfDoc.end();
        break;

      default:
        res.json({
          reportInfo: {
            code: report.code,
            name: report.name[language],
            description: report.description[language],
            generatedAt: new Date()
          },
          data
        });
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

    const dateRange = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };

    switch (type) {
      case 'financial': {
        // Get transactions within date range
        const transactions = await Transaction.find({
          status: 'posted',
          date: dateRange
        }).populate('entries.account');

        // Get current account balances
        const accounts = await Account.find({ status: 'active' });

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

        // Calculate profit/loss from transactions in date range
        transactions.forEach(transaction => {
          transaction.entries.forEach(entry => {
            if (entry.account.type === 'revenue') {
              report.profitLoss.revenue += entry.credit - entry.debit;
            } else if (entry.account.type === 'expense') {
              report.profitLoss.expenses += entry.debit - entry.credit;
            }
          });
        });

        report.profitLoss.netProfit = report.profitLoss.revenue - report.profitLoss.expenses;

        // Calculate balance sheet items
        accounts.forEach(account => {
          const item = {
            code: account.code,
            name: account.name,
            balance: Math.abs(account.balance)
          };

          switch (account.type) {
            case 'asset':
              if (account.category === 'current') {
                report.balanceSheet.assets.current.push(item);
                report.balanceSheet.assets.totalCurrent += account.balance;
              } else {
                report.balanceSheet.assets.fixed.push(item);
                report.balanceSheet.assets.totalFixed += account.balance;
              }
              break;
            case 'liability':
              if (account.category === 'current-liability') {
                report.balanceSheet.liabilities.current.push(item);
                report.balanceSheet.liabilities.totalCurrent += account.balance;
              } else {
                report.balanceSheet.liabilities.longTerm.push(item);
                report.balanceSheet.liabilities.totalLongTerm += account.balance;
              }
              break;
            case 'equity':
              report.balanceSheet.equity.items.push(item);
              report.balanceSheet.equity.total += account.balance;
              break;
          }
        });

        // Calculate totals and ratios
        report.balanceSheet.assets.total = 
          report.balanceSheet.assets.totalCurrent + report.balanceSheet.assets.totalFixed;
        report.balanceSheet.liabilities.total = 
          report.balanceSheet.liabilities.totalCurrent + report.balanceSheet.liabilities.totalLongTerm;

        // Calculate financial ratios
        if (report.balanceSheet.liabilities.totalCurrent > 0) {
          report.ratios.currentRatio = 
            report.balanceSheet.assets.totalCurrent / report.balanceSheet.liabilities.totalCurrent;
          report.ratios.quickRatio = 
            (report.balanceSheet.assets.totalCurrent) / report.balanceSheet.liabilities.totalCurrent;
        }

        if (report.balanceSheet.equity.total > 0) {
          report.ratios.debtToEquity = 
            report.balanceSheet.liabilities.total / report.balanceSheet.equity.total;
          report.ratios.returnOnEquity = 
            report.profitLoss.netProfit / report.balanceSheet.equity.total;
        }

        if (report.balanceSheet.assets.total > 0) {
          report.ratios.returnOnAssets = 
            report.profitLoss.netProfit / report.balanceSheet.assets.total;
        }

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

// Helper function to apply filters to pipeline
function applyFilters(pipeline, filters) {
  const matchStage = pipeline.find(stage => stage.$match) || { $match: {} };
  
  Object.entries(filters).forEach(([field, value]) => {
    if (value.startDate && value.endDate) {
      matchStage.$match[field] = {
        $gte: new Date(value.startDate),
        $lte: new Date(value.endDate)
      };
    } else if (Array.isArray(value)) {
      matchStage.$match[field] = { $in: value };
    } else {
      matchStage.$match[field] = value;
    }
  });

  return pipeline;
}

// Helper function to generate Excel
async function generateExcel(data, report, language) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(report.name[language]);

  // Add headers
  const headers = report.columns.map(col => col.header[language]);
  worksheet.addRow(headers);

  // Add data
  data.forEach(row => {
    const values = report.columns.map(col => {
      const value = row[col.field];
      switch (col.format) {
        case 'date':
          return moment(value).format('YYYY-MM-DD');
        case 'currency':
          return Number(value).toFixed(2);
        default:
          return value;
      }
    });
    worksheet.addRow(values);
  });

  // Style the worksheet
  worksheet.getRow(1).font = { bold: true };
  report.columns.forEach((col, index) => {
    worksheet.getColumn(index + 1).width = col.width || 15;
  });

  return workbook;
}

// Helper function to generate PDF
async function generatePDF(data, report, language) {
  const doc = new PDFDocument();

  // Add title
  doc.fontSize(16).text(report.name[language], { align: 'center' });
  doc.moveDown();

  // Add headers
  const headers = report.columns.map(col => col.header[language]);
  doc.fontSize(12).text(headers.join('  |  '));
  doc.moveDown();

  // Add data
  data.forEach(row => {
    const values = report.columns.map(col => {
      const value = row[col.field];
      switch (col.format) {
        case 'date':
          return moment(value).format('YYYY-MM-DD');
        case 'currency':
          return Number(value).toFixed(2);
        default:
          return value;
      }
    });
    doc.text(values.join('  |  '));
  });

  return doc;
}

// Helper function to get model name from category
function getModelNameFromCategory(category) {
  const modelMap = {
    tasks: 'Task',
    employees: 'Employee',
    financials: 'Transaction',
    sales: 'SalesInvoice',
    manufacturing: 'ManufacturingContractor',
    cutting: 'CuttingContractor',
    assets: 'Asset',
    inventory: 'Product'
  };
  return modelMap[category];
}

module.exports = router; 