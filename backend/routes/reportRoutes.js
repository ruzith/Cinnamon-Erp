const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Report = require('../models/domain/Report');
const Transaction = require('../models/domain/Transaction');
const Account = require('../models/domain/Account');
const Settings = require('../models/domain/Settings');
const { authorize } = require('../middleware/authMiddleware');
const reportTemplates = require('../data/reportTemplates');
const { pool } = require('../config/db');
const { SINHALA_FONT, containsSinhala } = require('../utils/fontUtils');

let ExcelJS, PDFDocument, moment;
try {
  ExcelJS = require('exceljs');
  PDFDocument = require('pdfkit');
  moment = require('moment');
} catch (error) {
  console.warn('Warning: Some report generation features may be unavailable');
}

// Add this helper function at the top of the file
async function executeQuery(query, params) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    connection.release();
  }
}

// Add this new route before the report routes
router.get('/departments', protect, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT d.department as department_name
      FROM employees e
      JOIN designations d ON e.designation_id = d.id
      WHERE d.department IS NOT NULL
      ORDER BY d.department
    `;

    const departments = await executeQuery(query);

    // Transform into the format expected by the frontend
    const formattedDepartments = departments.map(dept => ({
      value: dept.department_name,
      label: {
        en: dept.department_name.charAt(0).toUpperCase() + dept.department_name.slice(1),
        si: dept.department_name
      }
    }));

    res.json(formattedDepartments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this new route before the report routes
router.get('/product-lines', protect, async (req, res) => {
  try {
    const query = `
      SELECT
        p.id as value,
        p.name as product_name
      FROM products p
      WHERE p.status = 'active'
      ORDER BY p.name
    `;

    const productLines = await executeQuery(query);

    // Transform into the format expected by the frontend
    const formattedProductLines = productLines.map(prod => ({
      value: prod.value,
      label: {
        en: prod.product_name,
        si: prod.product_name
      }
    }));

    res.json(formattedProductLines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this new route before the report routes
router.get('/material-categories', protect, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        category as value,
        category as category_name
      FROM inventory
      WHERE category IS NOT NULL
      ORDER BY category
    `;

    const categories = await executeQuery(query);

    // Transform into the format expected by the frontend
    const formattedCategories = categories.map(cat => ({
      value: cat.value,
      label: {
        en: cat.category_name.charAt(0).toUpperCase() + cat.category_name.slice(1),
        si: cat.category_name
      }
    }));

    res.json(formattedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add route to get cutting contractors for report filters
router.get('/cutting-contractors', protect, async (req, res) => {
  try {
    const query = `
      SELECT
        id as value,
        name,
        contractor_id,
        status
      FROM cutting_contractors
      ORDER BY status = 'active' DESC, name
    `;

    const contractors = await executeQuery(query);

    // Transform into the format expected by the frontend
    const formattedContractors = contractors.map(contractor => ({
      value: contractor.value,
      label: {
        en: `${contractor.name} (${contractor.contractor_id})${contractor.status !== 'active' ? ' - ' + contractor.status.toUpperCase() : ''}`,
        si: `${contractor.name} (${contractor.contractor_id})${contractor.status !== 'active' ? ' - ' + contractor.status.toUpperCase() : ''}`
      }
    }));

    res.json(formattedContractors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available reports
router.get('/templates', protect, authorize('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    // Instead of querying the database, return the templates from reportTemplates.js
    const templates = reportTemplates.map(template => ({
      ...template,
      // Add any additional fields needed by the frontend
      status: 'active'
    }));

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate report
router.post('/generate/:code', protect, async (req, res) => {
  try {
    const { code } = req.params;
    const { filters, format = 'json', language = 'en' } = req.body;

    // Get currency settings using direct query
    const [settingsRows] = await pool.execute('SELECT * FROM settings LIMIT 1');
    const settings = settingsRows[0];

    if (!settings || !settings.default_currency) {
      return res.status(500).json({ message: 'Currency settings not configured' });
    }
    const currency = {
      code: settings.default_currency,
      symbol: settings.currency_symbol || '$'  // Fallback to $ if not set
    };

    // Find the report template
    const template = reportTemplates.find(t => t.code === code);
    if (!template) {
      return res.status(404).json({ message: 'Report template not found' });
    }

    // Execute query based on report type
    let results;
    switch (code) {
      case 'SALES_SUMMARY': {
        // Make the date filter optional
        const dateFilter = filters.dateRange ? new Date(filters.dateRange) : null;
        const query = `
          SELECT
            DATE(t.date) as date,
            SUM(te.credit - te.debit) as totalSales,
            COUNT(DISTINCT t.id) as itemCount,
            COUNT(DISTINCT te.id) as transactionCount,
            AVG(te.credit - te.debit) as averageSale,
            MAX(te.credit - te.debit) as maxSale,
            MIN(te.credit - te.debit) as minSale
          FROM transactions t
          JOIN transactions_entries te ON t.id = te.transaction_id
          JOIN accounts a ON te.account_id = a.id
          WHERE a.type = 'revenue'
          ${dateFilter ? 'AND DATE(t.date) >= ?' : ''}
          GROUP BY DATE(t.date)
          ORDER BY date DESC
          LIMIT 10
        `;

        const params = [
          ...(dateFilter ? [dateFilter.toISOString().split('T')[0]] : [])
        ];

        console.log('Executing SALES_SUMMARY query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('SALES_SUMMARY results:', rows);

        results = rows.map(row => ({
          date: row.date,
          totalSales: Number(row.totalSales || 0),
          itemCount: Number(row.itemCount || 0),
          transactionCount: Number(row.transactionCount || 0),
          averageSale: Number(row.averageSale || 0),
          maxSale: Number(row.maxSale || 0),
          minSale: Number(row.minSale || 0)
        }));
        break;
      }

      case 'EMPLOYEE_SUMMARY': {
        const departmentFilter = filters.department ? `AND d.department = ?` : '';
        const employmentTypeFilter = filters.employmentType ? `AND e.employment_type = ?` : '';
        const statusFilter = filters.status ? `AND e.status = ?` : '';

        const query = `
          SELECT
            e.name,
            d.title as designation,
            d.department,
            e.employment_type,
            e.status
          FROM employees e
          JOIN designations d ON e.designation_id = d.id
          WHERE 1=1
            ${departmentFilter}
            ${employmentTypeFilter}
            ${statusFilter}
          ORDER BY e.name ASC
        `;

        const params = [
          ...(filters.department ? [filters.department] : []),
          ...(filters.employmentType ? [filters.employmentType] : []),
          ...(filters.status ? [filters.status] : [])
        ];

        console.log('Executing EMPLOYEE_SUMMARY query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('EMPLOYEE_SUMMARY results:', rows);

        results = rows.map(row => ({
          name: row.name,
          designation: row.designation,
          department: row.department,
          employmentType: row.employment_type,
          status: row.status
        }));
        break;
      }

      case 'TASK_SUMMARY': {
        const { dateRangeStart, dateRangeEnd } = filters;
        const statusFilter = filters.status ? 'AND t.status = ?' : '';
        const priorityFilter = filters.priority ? 'AND t.priority = ?' : '';
        const dateFilter = (dateRangeStart && dateRangeEnd) ? 'AND t.due_date BETWEEN ? AND ?' : '';

        const query = `
          SELECT
            t.id as taskId,
            t.title,
            u.name as assignee,
            t.due_date as dueDate,
            t.status,
            t.priority,
            t.estimated_hours as estimatedHours,
            t.description
          FROM tasks t
          LEFT JOIN users u ON t.assigned_to = u.id
          WHERE 1=1
            ${dateFilter}
            ${statusFilter}
            ${priorityFilter}
          ORDER BY t.due_date ASC
        `;

        // Only add parameters that are actually defined
        const params = [
          ...(dateRangeStart && dateRangeEnd ? [dateRangeStart, dateRangeEnd] : []),
          ...(filters.status ? [filters.status] : []),
          ...(filters.priority ? [filters.priority] : [])
        ];

        console.log('Executing TASK_SUMMARY query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('TASK_SUMMARY results:', rows);

        results = rows.map(row => ({
          taskId: row.taskId,
          title: row.title,
          assignee: row.assignee,
          dueDate: row.dueDate,
          status: row.status,
          priority: row.priority,
          estimatedHours: Number(row.estimatedHours || 0),
          description: row.description
        }));
        break;
      }

      case 'CUTTING_PERFORMANCE': {
        const startDate = filters.dateRangeStart ? new Date(filters.dateRangeStart) : null;
        const endDate = filters.dateRangeEnd ? new Date(filters.dateRangeEnd) : null;
        const contractorFilter = filters.contractor ? 'AND cc.id = ?' : '';
        const statusFilter = filters.status ? 'AND la.status = ?' : '';

        const query = `
          SELECT
            cc.name as contractorName,
            SUM(ct.area_covered) as areaCovered,
            AVG(ct.progress) as efficiency,
            la.status
          FROM cutting_tasks ct
          JOIN land_assignments la ON ct.assignment_id = la.id
          JOIN cutting_contractors cc ON la.contractor_id = cc.id
          WHERE 1=1
            ${startDate ? 'AND ct.date >= ?' : ''}
            ${endDate ? 'AND ct.date <= ?' : ''}
            ${contractorFilter}
            ${statusFilter}
          GROUP BY cc.id, cc.name, la.status
          ORDER BY efficiency DESC
        `;

        const params = [
          ...(startDate ? [startDate.toISOString().split('T')[0]] : []),
          ...(endDate ? [endDate.toISOString().split('T')[0]] : []),
          ...(filters.contractor ? [filters.contractor] : []),
          ...(filters.status ? [filters.status] : [])
        ];

        console.log('Executing CUTTING_PERFORMANCE query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('CUTTING_PERFORMANCE results:', rows);

        results = rows.map(row => ({
          contractorName: row.contractorName,
          areaCovered: Number(row.areaCovered || 0),
          efficiency: Number(row.efficiency || 0),
          status: row.status
        }));
        break;
      }

      case 'MANUFACTURING_ADVANCED': {
        const dateFilter = filters.dateRange ? new Date(filters.dateRange) : null;
        const query = `
          SELECT
            p.name as productLine,
            SUM(mo.quantity) as outputQuantity,
            AVG(mo.defect_rate) as defectRate,
            AVG(mo.efficiency) as efficiency,
            SUM(mo.downtime_hours) as downtime,
            AVG(mo.cost_per_unit) as costPerUnit
          FROM manufacturing_orders mo
          JOIN products p ON mo.product_id = p.id
          WHERE 1=1
            ${dateFilter ? 'AND DATE(mo.production_date) = ?' : ''}
            ${filters.productLine ? 'AND p.id = ?' : ''}
            ${filters.efficiency ?
              filters.efficiency === 'high' ? 'AND mo.efficiency > 0.9' :
              filters.efficiency === 'medium' ? 'AND mo.efficiency BETWEEN 0.7 AND 0.9' :
              filters.efficiency === 'low' ? 'AND mo.efficiency < 0.7' : ''
            : ''}
          GROUP BY p.name
          ORDER BY p.name
        `;

        const params = [
          ...(dateFilter ? [dateFilter.toISOString().split('T')[0]] : []),
          ...(filters.productLine ? [filters.productLine] : [])
        ];

        console.log('Executing MANUFACTURING_ADVANCED query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('MANUFACTURING_ADVANCED results:', rows);

        results = rows.map(row => ({
          productLine: row.productLine,
          outputQuantity: Number(row.outputQuantity || 0),
          defectRate: Number(row.defectRate || 0) / 100,
          efficiency: Number(row.efficiency || 0) / 100,
          downtime: Number(row.downtime || 0),
          costPerUnit: Number(row.costPerUnit || 0)
        }));
        break;
      }

      case 'MANUFACTURING_PURCHASING': {
        const query = `
          SELECT
            i.id as materialId,
            i.product_name as materialCode,
            i.product_name as materialName,
            i.category as materialCategory,
            SUM(pi.net_weight) as quantity,
            AVG(pi.rate) as unitPrice,
            SUM(pi.amount) as totalCost,
            AVG(DATEDIFF(piv.due_date, piv.invoice_date)) as deliveryTime,
            COUNT(DISTINCT piv.id) as orderCount,
            MIN(pi.rate) as minPrice,
            MAX(pi.rate) as maxPrice,
            AVG(pi.amount) as averageOrderValue
          FROM purchase_items pi
          JOIN purchase_invoices piv ON pi.invoice_id = piv.id
          JOIN inventory i ON pi.grade_id = i.id
          WHERE 1=1
            ${filters.dateRange ? 'AND DATE(piv.invoice_date) = ?' : ''}
            ${filters.materialCategory ? 'AND i.category = ?' : ''}
          GROUP BY i.id, i.product_name, i.category
          ORDER BY i.product_name
          LIMIT 10
        `;

        const params = [
          ...(filters.dateRange ? [new Date(filters.dateRange).toISOString().split('T')[0]] : []),
          ...(filters.materialCategory ? [filters.materialCategory] : [])
        ];

        console.log('Executing MANUFACTURING_PURCHASING query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('MANUFACTURING_PURCHASING results:', rows);

        results = rows.map(row => ({
          materialId: row.materialId,
          materialCode: row.materialCode,
          materialName: row.materialName,
          materialCategory: row.materialCategory,
          quantity: Number(row.quantity || 0),
          unitPrice: Number(row.unitPrice || 0),
          totalCost: Number(row.totalCost || 0),
          deliveryTime: Number(row.deliveryTime || 0),
          orderCount: Number(row.orderCount || 0),
          minPrice: Number(row.minPrice || 0),
          maxPrice: Number(row.maxPrice || 0),
          averageOrderValue: Number(row.averageOrderValue || 0)
        }));
        break;
      }

      default:
        return res.status(400).json({ message: 'Unsupported report type' });
    }

    // Handle different output formats
    switch (format.toLowerCase()) {
      case 'json':
        return res.json(results);

      case 'excel': {
        if (!ExcelJS) {
          throw new Error('Excel export is not available');
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(template.name[language]);

        // Set default font for the worksheet
        worksheet.properties.defaultRowHeight = 20;

        // Configure columns with proper encoding
        worksheet.columns = template.columns.map(col => ({
          header: col.header[language],
          key: col.field,
          width: 20,
          style: {
            font: {
              name: containsSinhala(col.header[language]) ? 'Noto Sans Sinhala' : 'Arial',
              size: 11
            },
            alignment: {
              vertical: 'middle',
              horizontal: 'left',
              wrapText: true
            },
            numFmt: getExcelFormat(col.format, currency)
          }
        }));

        // Add data rows with proper font handling
        results.forEach(row => {
          const formattedRow = {};
          template.columns.forEach(col => {
            const value = formatValue(row[col.field], col.format, currency);
            formattedRow[col.field] = value;

            // Set Sinhala font for cells containing Sinhala text
            const cellRef = `${col.field}${worksheet.rowCount + 1}`;
            if (containsSinhala(String(value))) {
              worksheet.getCell(cellRef).font = {
                name: 'Noto Sans Sinhala',
                size: 11
              };
            }
          });
          worksheet.addRow(formattedRow);
        });

        // Style header row
        worksheet.getRow(1).font = {
          bold: true,
          size: 12,
          name: language === 'si' ? 'Noto Sans Sinhala' : 'Arial'
        };

        // Set response headers with UTF-8 encoding
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(code)}_${Date.now()}.xlsx`
        );

        await workbook.xlsx.write(res);
        return res.end();
      }

      case 'pdf': {
        if (!PDFDocument) {
          throw new Error('PDF export is not available');
        }

        // Add these helper functions for table styling
        function drawTableHeader(doc, headers, columnWidths, startX, startY) {
          // Calculate header height based on content
          const padding = 8;
          let maxHeaderLines = 1;

          // Calculate required height for each header
          headers.forEach((header, i) => {
            const width = columnWidths[i] - (padding * 2);
            const font = containsSinhala(header) ? 'SinhalaFont' : 'Helvetica-Bold';

            // Calculate how many lines the text will wrap to
            doc.font(font).fontSize(10);
            const words = header.split(' ');
            let currentLine = '';
            let lines = 1;

            words.forEach(word => {
              const testLine = currentLine + (currentLine ? ' ' : '') + word;
              if (doc.widthOfString(testLine) > width) {
                currentLine = word;
                lines++;
              } else {
                currentLine = testLine;
              }
            });

            maxHeaderLines = Math.max(maxHeaderLines, lines);
          });

          // Calculate final header height based on content
          const lineHeight = 14; // Increased line height for headers
          const headerHeight = (maxHeaderLines * lineHeight) + (padding * 2);

          // Draw header background
          doc.fillColor('#f4f4f4')
             .rect(startX, startY, doc.page.width - (startX * 2), headerHeight)
             .fill();

          // Draw header text
          doc.fillColor('#000000');
          let currentX = startX;

          headers.forEach((header, i) => {
            const font = containsSinhala(header) ? 'SinhalaFont' : 'Helvetica-Bold';

            doc.font(font)
               .fontSize(10)
               .text(
                 header,
                 currentX + padding,
                 startY + padding,
                 {
                   width: columnWidths[i] - (padding * 2),
                   height: headerHeight - (padding * 2),
                   align: getColumnAlignment(i, headers.length),
                   lineBreak: true,
                   baseline: 'top'
                 }
               );
            currentX += columnWidths[i];
          });

          // Draw header borders
          doc.strokeColor('#e0e0e0');
          headers.forEach((_, i) => {
            const x = startX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
            doc.moveTo(x, startY)
               .lineTo(x, startY + headerHeight)
               .stroke();
          });

          // Draw right border
          doc.moveTo(startX + columnWidths.reduce((sum, w) => sum + w, 0), startY)
             .lineTo(startX + columnWidths.reduce((sum, w) => sum + w, 0), startY + headerHeight)
             .stroke();

          // Draw bottom border
          doc.moveTo(startX, startY + headerHeight)
             .lineTo(startX + columnWidths.reduce((sum, w) => sum + w, 0), startY + headerHeight)
             .stroke();

          return startY + headerHeight;
        }

        function drawTableRow(doc, row, columns, columnWidths, startX, startY, isAlternate = false) {
          // Calculate row height based on content
          const lineHeight = 12;
          const padding = 8;
          let maxLines = 1;

          // Calculate required height for each cell
          columns.forEach((col, i) => {
            const value = col.format === 'currency'
              ? formatPDFCurrency(row[col.field], currency)
              : formatValue(row[col.field], col.format, currency);

            const text = String(value);
            const width = columnWidths[i] - (padding * 2);
            const lines = doc.font(containsSinhala(text) ? 'SinhalaFont' : 'Helvetica')
                            .fontSize(9)
                            .widthOfString(text) / width;
            maxLines = Math.max(maxLines, Math.ceil(lines));
          });

          const rowHeight = (maxLines * lineHeight) + (padding * 2);

          // Draw row background for alternate rows
          if (isAlternate) {
            doc.fillColor('#f9f9f9')
               .rect(startX, startY, doc.page.width - (startX * 2), rowHeight)
               .fill();
          }

          // Draw row data
          doc.fillColor('#000000');
          let currentX = startX;

          columns.forEach((col, i) => {
            const value = col.format === 'currency'
              ? formatPDFCurrency(row[col.field], currency)
              : formatValue(row[col.field], col.format, currency);

            const text = String(value);
            const font = containsSinhala(text) ? 'SinhalaFont' : 'Helvetica';

            doc.font(font)
               .fontSize(9)
               .text(
                 text,
                 currentX + padding,
                 startY + padding,
                 {
                   width: columnWidths[i] - (padding * 2),
                   height: rowHeight - (padding * 2),
                   align: getColumnAlignment(i, columns.length),
                   lineBreak: true
                 }
               );

            currentX += columnWidths[i];
          });

          // Draw cell borders
          doc.strokeColor('#e0e0e0');
          columns.forEach((col, i) => {
            const x = startX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
            doc.moveTo(x, startY)
               .lineTo(x, startY + rowHeight)
               .stroke();
          });

          // Draw right border
          doc.moveTo(startX + columnWidths.reduce((sum, w) => sum + w, 0), startY)
             .lineTo(startX + columnWidths.reduce((sum, w) => sum + w, 0), startY + rowHeight)
             .stroke();

          return startY + rowHeight;
        }

        function getColumnAlignment(index, totalColumns) {
          if (index === 0) return 'left'; // First column left-aligned
          if (index === totalColumns - 1) return 'right'; // Last column right-aligned
          return 'center'; // Middle columns center-aligned
        }

        function calculateColumnWidths(doc, columns, margins) {
          const availableWidth = doc.page.width - (margins.left + margins.right);

          // Define relative weights for different types of columns
          const weights = columns.map(col => {
            switch (col.field) {
              case 'productLine':
              case 'title':
              case 'description':
              case 'contractorName':
                return 4; // Extra wide columns
              case 'name':
              case 'designation':
              case 'department':
                return 3; // Wide columns
              case 'date':
              case 'status':
              case 'priority':
                return 1.5; // Narrow columns
              default:
                return 2; // Medium columns
            }
          });

          const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
          return weights.map(weight => (weight / totalWeight) * availableWidth);
        }

        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          bufferPages: true
        });

        // Set up fonts
        doc.registerFont('SinhalaFont', SINHALA_FONT);
        doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');

        // Define margins
        const margins = { top: 50, bottom: 50, left: 40, right: 40 };

        // Calculate column widths
        const columnWidths = calculateColumnWidths(doc, template.columns, margins);

        // Add title and date
        const titleText = template.name[language];
        doc.font(containsSinhala(titleText) ? 'SinhalaFont' : 'Helvetica-Bold')
           .fontSize(16)
           .text(titleText, { align: 'center' });
        doc.moveDown();

        doc.font('Helvetica')
           .fontSize(10)
           .text(
             `Generated on: ${new Date().toLocaleDateString()}`,
             { align: 'right' }
           );
        doc.moveDown();

        // Draw table
        let currentY = doc.y;
        const headers = template.columns.map(col => col.header[language]);

        // Draw header
        currentY = drawTableHeader(doc, headers, columnWidths, margins.left, currentY);

        // Draw rows
        results.forEach((row, index) => {
          // Add new page if needed
          if (currentY > doc.page.height - margins.bottom) {
            doc.addPage();
            currentY = margins.top;
            currentY = drawTableHeader(doc, headers, columnWidths, margins.left, currentY);
          }

          currentY = drawTableRow(
            doc,
            row,
            template.columns,
            columnWidths,
            margins.left,
            currentY,
            index % 2 === 1
          );
        });

        // Add page numbers
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          doc.font('Helvetica')
             .fontSize(8)
             .text(
               `Page ${i + 1} of ${totalPages}`,
               margins.left,
               doc.page.height - 20,
               { align: 'center' }
             );
        }

        // Set response headers and send
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(code)}_${Date.now()}.pdf`
        );

        doc.pipe(res);
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
function getExcelFormat(format, currency) {
  switch (format) {
    case 'currency':
      return `"${currency.symbol}"#,##0.00;[Red]"${currency.symbol}"-#,##0.00`;
    case 'number':
      return '#,##0.00;[Red]-#,##0.00';
    case 'percentage':
      return '0.0%;[Red]-0.0%';
    case 'date':
      return 'yyyy-mm-dd';
    default:
      return '@';
  }
}

function formatValue(value, format, currency) {
  if (value === null || value === undefined) return '';

  switch (format) {
    case 'currency': {
      if (typeof value !== 'number') return value;

      // Format amount exactly like frontend currencyUtils.js
      const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value || 0);

      return `${currency.symbol} ${formattedAmount}`;
    }

    case 'number':
      return typeof value === 'number' ?
        new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value) :
        value;

    case 'percentage':
      if (typeof value !== 'number') return value;
      // Convert decimal to percentage (e.g., 0.46 -> 46%)
      const percentage = value * 100;
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value);

    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      return value;

    default:
      return value;
  }
}

// Add this helper function for PDF currency formatting
function formatPDFCurrency(value, currency) {
  if (typeof value !== 'number') return value;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

  return `${currency.symbol} ${formattedAmount}`;
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

// Task Report Generation
router.post('/generate/TASK_SUMMARY', protect, async (req, res) => {
  try {
    const { filters } = req.body;

    let query = `
      SELECT
        t.id as taskId,
        t.title,
        u.name as assignee,
        t.due_date as dueDate,
        t.status,
        t.completion_rate as completionRate
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (filters.dateRange) {
      query += ` AND t.due_date BETWEEN ? AND ?`;
      queryParams.push(filters.dateRange.start, filters.dateRange.end);
    }

    if (filters.status) {
      query += ` AND t.status = ?`;
      queryParams.push(filters.status);
    }

    if (filters.priority) {
      query += ` AND t.priority = ?`;
      queryParams.push(filters.priority);
    }

    const [rows] = await pool.execute(query, queryParams);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manufacturing Advanced Report
router.post('/generate/MANUFACTURING_ADVANCED', protect, async (req, res) => {
  try {
    const { filters } = req.body;

    let query = `
      SELECT
        p.id,
        p.name as productLine,
        SUM(mo.quantity) as outputQuantity,
        AVG(mo.defect_rate) as defectRate,
        AVG(mo.efficiency) as efficiency,
        SUM(mo.downtime_hours) as downtime,
        AVG(mo.cost_per_unit) as costPerUnit
      FROM manufacturing_orders mo
      JOIN products p ON mo.product_id = p.id
      WHERE mo.status = 'completed'
    `;

    const queryParams = [];

    if (filters.dateRange) {
      query += ` AND mo.production_date BETWEEN ? AND ?`;
      queryParams.push(filters.dateRange.start, filters.dateRange.end);
    }

    if (filters.productLine) {
      query += ` AND p.id = ?`;
      queryParams.push(filters.productLine);
    }

    if (filters.efficiency) {
      switch(filters.efficiency) {
        case 'high':
          query += ` AND mo.efficiency > 0.9`;
          break;
        case 'medium':
          query += ` AND mo.efficiency BETWEEN 0.7 AND 0.9`;
          break;
        case 'low':
          query += ` AND mo.efficiency < 0.7`;
          break;
      }
    }

    // Add GROUP BY clause
    query += ` GROUP BY p.id, p.name`;

    const rows = await executeQuery(query, queryParams);

    const results = rows.map(row => ({
      productLine: row.productLine,
      outputQuantity: Number(row.outputQuantity || 0),
      defectRate: Number(row.defectRate || 0) / 100,
      efficiency: Number(row.efficiency || 0) / 100,
      downtime: Number(row.downtime || 0),
      costPerUnit: Number(row.costPerUnit || 0)
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manufacturing Purchasing Report
router.post('/generate/MANUFACTURING_PURCHASING', protect, async (req, res) => {
  try {
    const { filters } = req.body;

    let query = `
      SELECT
        i.code as materialCode,
        i.name as materialName,
        SUM(po.quantity) as quantity,
        AVG(po.unit_price) as unitPrice,
        SUM(po.quantity * po.unit_price) as totalCost,
        AVG(DATEDIFF(po.delivery_date, po.order_date)) as deliveryTime
      FROM purchase_orders po
      JOIN inventory i ON po.material_id = i.id
      WHERE po.status = 'completed'
    `;

    const queryParams = [];

    if (filters.dateRange) {
      const date = new Date(filters.dateRange);
      query += ` AND DATE(po.order_date) = ?`;
      queryParams.push(date.toISOString().split('T')[0]);
    }

    if (filters.materialCategory) {
      query += ` AND i.category = ?`;
      queryParams.push(filters.materialCategory);
    }

    query += ` GROUP BY i.id, i.code, i.name
               ORDER BY i.name`;

    const rows = await executeQuery(query, queryParams);

    const results = rows.map(row => ({
      materialCode: row.materialCode,
      materialName: row.materialName,
      quantity: Number(row.quantity || 0),
      unitPrice: Number(row.unitPrice || 0),
      totalCost: Number(row.totalCost || 0),
      deliveryTime: Number(row.deliveryTime || 0)
    }));

    res.json(results);
  } catch (error) {
    console.error('Error generating manufacturing purchasing report:', error);
    res.status(500).json({ message: error.message });
  }
});

// Preview report
router.post('/preview/:code', protect, async (req, res) => {
  try {
    const { code } = req.params;
    const { filters = {}, language = 'en' } = req.body;

    console.log('Preview request:', { code, filters, language });

    // Get currency settings using direct query
    const [settingsRows] = await pool.execute('SELECT * FROM settings LIMIT 1');
    const settings = settingsRows[0];

    if (!settings || !settings.default_currency) {
      return res.status(500).json({ message: 'Currency settings not configured' });
    }
    const currency = {
      code: settings.default_currency,
      symbol: settings.currency_symbol || '$'  // Fallback to $ if not set
    };

    // Find the report template
    const template = reportTemplates.find(t => t.code === code);
    if (!template) {
      return res.status(404).json({ message: 'Report template not found' });
    }

    // Execute query based on report type
    let results;
    switch (code) {
      case 'SALES_SUMMARY': {
        // Make the date filter optional
        const dateFilter = filters.dateRange ? new Date(filters.dateRange) : null;
        const query = `
          SELECT
            DATE(t.date) as date,
            SUM(te.credit - te.debit) as totalSales,
            COUNT(DISTINCT t.id) as itemCount,
            COUNT(DISTINCT te.id) as transactionCount,
            AVG(te.credit - te.debit) as averageSale,
            MAX(te.credit - te.debit) as maxSale,
            MIN(te.credit - te.debit) as minSale
          FROM transactions t
          JOIN transactions_entries te ON t.id = te.transaction_id
          JOIN accounts a ON te.account_id = a.id
          WHERE a.type = 'revenue'
          ${dateFilter ? 'AND DATE(t.date) >= ?' : ''}
          GROUP BY DATE(t.date)
          ORDER BY date DESC
          LIMIT 10
        `;

        const params = [
          ...(dateFilter ? [dateFilter.toISOString().split('T')[0]] : [])
        ];

        console.log('Executing SALES_SUMMARY query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('SALES_SUMMARY results:', rows);

        results = rows.map(row => ({
          date: row.date,
          totalSales: Number(row.totalSales || 0),
          itemCount: Number(row.itemCount || 0),
          transactionCount: Number(row.transactionCount || 0),
          averageSale: Number(row.averageSale || 0),
          maxSale: Number(row.maxSale || 0),
          minSale: Number(row.minSale || 0)
        }));
        break;
      }

      case 'EMPLOYEE_SUMMARY': {
        const departmentFilter = filters.department ? `AND d.department = ?` : '';
        const employmentTypeFilter = filters.employmentType ? `AND e.employment_type = ?` : '';
        const statusFilter = filters.status ? `AND e.status = ?` : '';

        const query = `
          SELECT
            e.name,
            d.title as designation,
            d.department,
            e.employment_type,
            e.status
          FROM employees e
          JOIN designations d ON e.designation_id = d.id
          WHERE 1=1
            ${departmentFilter}
            ${employmentTypeFilter}
            ${statusFilter}
          ORDER BY e.name ASC
        `;

        const params = [
          ...(filters.department ? [filters.department] : []),
          ...(filters.employmentType ? [filters.employmentType] : []),
          ...(filters.status ? [filters.status] : [])
        ];

        console.log('Executing EMPLOYEE_SUMMARY query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('EMPLOYEE_SUMMARY results:', rows);

        results = rows.map(row => ({
          name: row.name,
          designation: row.designation,
          department: row.department,
          employmentType: row.employment_type,
          status: row.status
        }));
        break;
      }

      case 'TASK_SUMMARY': {
        const { dateRangeStart, dateRangeEnd } = filters;
        const statusFilter = filters.status ? 'AND t.status = ?' : '';
        const priorityFilter = filters.priority ? 'AND t.priority = ?' : '';
        const dateFilter = (dateRangeStart && dateRangeEnd) ? 'AND t.due_date BETWEEN ? AND ?' : '';

        const query = `
          SELECT
            t.id as taskId,
            t.title,
            u.name as assignee,
            t.due_date as dueDate,
            t.status,
            t.priority,
            t.estimated_hours as estimatedHours,
            t.description
          FROM tasks t
          LEFT JOIN users u ON t.assigned_to = u.id
          WHERE 1=1
            ${dateFilter}
            ${statusFilter}
            ${priorityFilter}
          ORDER BY t.due_date ASC
        `;

        // Only add parameters that are actually defined
        const params = [
          ...(dateRangeStart && dateRangeEnd ? [dateRangeStart, dateRangeEnd] : []),
          ...(filters.status ? [filters.status] : []),
          ...(filters.priority ? [filters.priority] : [])
        ];

        console.log('Executing TASK_SUMMARY query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('TASK_SUMMARY results:', rows);

        results = rows.map(row => ({
          taskId: row.taskId,
          title: row.title,
          assignee: row.assignee,
          dueDate: row.dueDate,
          status: row.status,
          priority: row.priority,
          estimatedHours: Number(row.estimatedHours || 0),
          description: row.description
        }));
        break;
      }

      case 'CUTTING_PERFORMANCE': {
        const startDate = filters.dateRangeStart ? new Date(filters.dateRangeStart) : null;
        const endDate = filters.dateRangeEnd ? new Date(filters.dateRangeEnd) : null;
        const contractorFilter = filters.contractor ? 'AND cc.id = ?' : '';
        const statusFilter = filters.status ? 'AND la.status = ?' : '';

        const query = `
          SELECT
            cc.name as contractorName,
            SUM(ct.area_covered) as areaCovered,
            AVG(ct.progress) as efficiency,
            la.status
          FROM cutting_tasks ct
          JOIN land_assignments la ON ct.assignment_id = la.id
          JOIN cutting_contractors cc ON la.contractor_id = cc.id
          WHERE 1=1
            ${startDate ? 'AND ct.date >= ?' : ''}
            ${endDate ? 'AND ct.date <= ?' : ''}
            ${contractorFilter}
            ${statusFilter}
          GROUP BY cc.id, cc.name, la.status
          ORDER BY efficiency DESC
        `;

        const params = [
          ...(startDate ? [startDate.toISOString().split('T')[0]] : []),
          ...(endDate ? [endDate.toISOString().split('T')[0]] : []),
          ...(filters.contractor ? [filters.contractor] : []),
          ...(filters.status ? [filters.status] : [])
        ];

        console.log('Executing CUTTING_PERFORMANCE query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('CUTTING_PERFORMANCE results:', rows);

        results = rows.map(row => ({
          contractorName: row.contractorName,
          areaCovered: Number(row.areaCovered || 0),
          efficiency: Number(row.efficiency || 0),
          status: row.status
        }));
        break;
      }

      case 'MANUFACTURING_ADVANCED': {
        const dateFilter = filters.dateRange ? new Date(filters.dateRange) : null;
        const query = `
          SELECT
            p.name as productLine,
            SUM(mo.quantity) as outputQuantity,
            AVG(mo.defect_rate) as defectRate,
            AVG(mo.efficiency) as efficiency,
            SUM(mo.downtime_hours) as downtime,
            AVG(mo.cost_per_unit) as costPerUnit
          FROM manufacturing_orders mo
          JOIN products p ON mo.product_id = p.id
          WHERE 1=1
            ${dateFilter ? 'AND DATE(mo.production_date) = ?' : ''}
            ${filters.productLine ? 'AND p.id = ?' : ''}
            ${filters.efficiency ?
              filters.efficiency === 'high' ? 'AND mo.efficiency > 0.9' :
              filters.efficiency === 'medium' ? 'AND mo.efficiency BETWEEN 0.7 AND 0.9' :
              filters.efficiency === 'low' ? 'AND mo.efficiency < 0.7' : ''
            : ''}
          GROUP BY p.name
          ORDER BY p.name
        `;

        const params = [
          ...(dateFilter ? [dateFilter.toISOString().split('T')[0]] : []),
          ...(filters.productLine ? [filters.productLine] : [])
        ];

        console.log('Executing MANUFACTURING_ADVANCED query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('MANUFACTURING_ADVANCED results:', rows);

        results = rows.map(row => ({
          productLine: row.productLine,
          outputQuantity: Number(row.outputQuantity || 0),
          defectRate: Number(row.defectRate || 0) / 100,
          efficiency: Number(row.efficiency || 0) / 100,
          downtime: Number(row.downtime || 0),
          costPerUnit: Number(row.costPerUnit || 0)
        }));
        break;
      }

      case 'MANUFACTURING_PURCHASING': {
        const query = `
          SELECT
            i.id as materialId,
            i.product_name as materialCode,
            i.product_name as materialName,
            i.category as materialCategory,
            SUM(pi.net_weight) as quantity,
            AVG(pi.rate) as unitPrice,
            SUM(pi.amount) as totalCost,
            AVG(DATEDIFF(piv.due_date, piv.invoice_date)) as deliveryTime,
            COUNT(DISTINCT piv.id) as orderCount,
            MIN(pi.rate) as minPrice,
            MAX(pi.rate) as maxPrice,
            AVG(pi.amount) as averageOrderValue
          FROM purchase_items pi
          JOIN purchase_invoices piv ON pi.invoice_id = piv.id
          JOIN inventory i ON pi.grade_id = i.id
          WHERE 1=1
            ${filters.dateRange ? 'AND DATE(piv.invoice_date) = ?' : ''}
            ${filters.materialCategory ? 'AND i.category = ?' : ''}
          GROUP BY i.id, i.product_name, i.category
          ORDER BY i.product_name
          LIMIT 10
        `;

        const params = [
          ...(filters.dateRange ? [new Date(filters.dateRange).toISOString().split('T')[0]] : []),
          ...(filters.materialCategory ? [filters.materialCategory] : [])
        ];

        console.log('Executing MANUFACTURING_PURCHASING query:', query, 'with params:', params);
        const rows = await executeQuery(query, params);
        console.log('MANUFACTURING_PURCHASING results:', rows);

        results = rows.map(row => ({
          materialId: row.materialId,
          materialCode: row.materialCode,
          materialName: row.materialName,
          materialCategory: row.materialCategory,
          quantity: Number(row.quantity || 0),
          unitPrice: Number(row.unitPrice || 0),
          totalCost: Number(row.totalCost || 0),
          deliveryTime: Number(row.deliveryTime || 0),
          orderCount: Number(row.orderCount || 0),
          minPrice: Number(row.minPrice || 0),
          maxPrice: Number(row.maxPrice || 0),
          averageOrderValue: Number(row.averageOrderValue || 0)
        }));
        break;
      }

      default:
        return res.status(400).json({ message: 'Unsupported report type' });
    }

    // Return preview data with more information
    const response = {
      preview: true,
      total: results.length,
      isPartial: results.length === 10,
      data: results,
      filters: filters,
      template: {
        code: template.code,
        name: template.name
      }
    };

    console.log('Sending response:', response);
    return res.json(response);

  } catch (error) {
    console.error('Report preview error:', error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;