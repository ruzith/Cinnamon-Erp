const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { authorize } = require('../middleware/authMiddleware');
const reportTemplates = require('../data/reportTemplates');
const pool = require('../config/db');

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
    const { code } = req.params;
    const { filters, format, language } = req.body;
    
    // Find the report template
    const template = reportTemplates.find(t => t.code === code);
    if (!template) {
      return res.status(404).json({ message: 'Report template not found' });
    }

    // Execute query based on report type
    let results;
    switch (code) {
      case 'SALES_SUMMARY': {
        const dateFilter = filters.dateRange ? new Date(filters.dateRange) : null;
        const [rows] = await Transaction.pool.execute(`
          SELECT 
            DATE(t.date) as date,
            SUM(te.credit - te.debit) as totalSales,
            COUNT(DISTINCT t.id) as itemCount
          FROM transactions t
          JOIN transactions_entries te ON t.id = te.transaction_id
          JOIN accounts a ON te.account_id = a.id
          WHERE t.status = ?
            AND a.type = 'revenue'
            ${dateFilter ? 'AND DATE(t.date) = ?' : ''}
          GROUP BY DATE(t.date)
          ORDER BY date DESC
        `, [
          filters.status || 'completed',
          ...(dateFilter ? [dateFilter.toISOString().split('T')[0]] : [])
        ]);
        
        results = rows.map(row => ({
          date: row.date,
          totalSales: Number(row.totalSales),
          itemCount: Number(row.itemCount)
        }));
        break;
      }

      case 'EMPLOYEE_SUMMARY': {
        const departmentFilter = filters.department ? `AND e.department = ?` : '';
        const employmentTypeFilter = filters.employmentType ? `AND e.employment_type = ?` : '';
        
        const [rows] = await pool.execute(`
          SELECT 
            e.name,
            e.designation,
            e.status
          FROM employees e
          WHERE e.status = 'active'
            ${departmentFilter}
            ${employmentTypeFilter}
          ORDER BY e.name ASC
        `, [
          ...(filters.department ? [filters.department] : []),
          ...(filters.employmentType ? [filters.employmentType] : [])
        ]);
        
        results = rows.map(row => ({
          name: row.name,
          designation: row.designation,
          status: row.status
        }));
        break;
      }

      case 'CUTTING_PERFORMANCE': {
        const dateFilter = filters.dateRange ? new Date(filters.dateRange) : null;
        const contractorFilter = filters.contractor ? `AND c.id = ?` : '';
        
        const [rows] = await pool.execute(`
          SELECT 
            c.name as contractorName,
            SUM(co.area_covered) as areaCovered,
            AVG(co.efficiency_score) as efficiency
          FROM cutting_operations co
          JOIN contractors c ON co.contractor_id = c.id
          WHERE co.status = 'completed'
            ${dateFilter ? 'AND DATE(co.date) = ?' : ''}
            ${contractorFilter}
          GROUP BY c.id, c.name
          ORDER BY efficiency DESC
        `, [
          ...(dateFilter ? [dateFilter.toISOString().split('T')[0]] : []),
          ...(filters.contractor ? [filters.contractor] : [])
        ]);
        
        results = rows.map(row => ({
          contractorName: row.contractorName,
          areaCovered: Number(row.areaCovered),
          efficiency: Number(row.efficiency)
        }));
        break;
      }

      default:
        return res.status(400).json({ message: 'Unsupported report type' });
    }

    // Handle different output formats
    switch (format) {
      case 'json':
        return res.json(results);

      case 'excel': {
        if (!ExcelJS) {
          throw new Error('Excel export is not available');
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(template.name[language]);

        // Set up columns based on template
        worksheet.columns = template.columns.map(col => ({
          header: col.header[language],
          key: col.field,
          width: 15,
          style: {
            numFmt: getExcelFormat(col.format)
          }
        }));

        // Add data rows
        results.forEach(row => {
          const formattedRow = {};
          template.columns.forEach(col => {
            formattedRow[col.field] = formatValue(row[col.field], col.format);
          });
          worksheet.addRow(formattedRow);
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Set response headers
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${code}_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        return res.end();
      }

      case 'pdf': {
        if (!PDFDocument) {
          throw new Error('PDF export is not available');
        }

        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${code}_${new Date().toISOString().split('T')[0]}.pdf`
        );

        // Pipe the PDF to the response
        doc.pipe(res);

        // Add title
        doc.fontSize(16).text(template.name[language], { align: 'center' });
        doc.moveDown();

        // Add date
        doc.fontSize(10).text(
          `Generated on: ${new Date().toLocaleDateString()}`,
          { align: 'right' }
        );
        doc.moveDown();

        // Create table header
        const headers = template.columns.map(col => col.header[language]);
        const tableTop = doc.y;
        let currentY = tableTop;
        
        // Calculate column widths
        const pageWidth = doc.page.width - 100; // margins
        const columnWidth = pageWidth / headers.length;
        
        // Draw headers
        headers.forEach((header, i) => {
          doc.fontSize(10)
             .text(header, 
                  50 + (i * columnWidth), 
                  currentY,
                  { width: columnWidth, align: 'left' });
        });
        
        currentY += 20;
        doc.moveTo(50, currentY).lineTo(50 + pageWidth, currentY).stroke();
        currentY += 10;

        // Add data rows
        results.forEach(row => {
          template.columns.forEach((col, i) => {
            const value = formatValue(row[col.field], col.format);
            doc.fontSize(10)
               .text(value.toString(),
                    50 + (i * columnWidth),
                    currentY,
                    { width: columnWidth, align: 'left' });
          });
          currentY += 20;

          // Add new page if needed
          if (currentY > doc.page.height - 50) {
            doc.addPage();
            currentY = 50;
          }
        });

        // Finalize PDF
        doc.end();
        return;
      }

      default:
        return res.json(results);
    }
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper functions
function getExcelFormat(format) {
  switch (format) {
    case 'currency':
      return '"$"#,##0.00';
    case 'number':
      return '#,##0';
    case 'percentage':
      return '0.00%';
    case 'date':
      return 'yyyy-mm-dd';
    default:
      return '@';
  }
}

function formatValue(value, format) {
  if (value === null || value === undefined) return '';
  
  switch (format) {
    case 'currency':
      return typeof value === 'number' ? 
        value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) :
        value;
    case 'number':
      return typeof value === 'number' ? 
        value.toLocaleString('en-US') :
        value;
    case 'percentage':
      return typeof value === 'number' ? 
        `${(value * 100).toFixed(2)}%` :
        value;
    case 'date':
      return value instanceof Date ? 
        value.toISOString().split('T')[0] :
        value;
    default:
      return value;
  }
}

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