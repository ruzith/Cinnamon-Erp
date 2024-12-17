const BaseModel = require('./BaseModel');
const reportTemplates = require('../data/reportTemplates');

class Report extends BaseModel {
  constructor() {
    super('reports');
  }

  async findByCode(code) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM reports WHERE code = ? AND status = "active"',
      [code]
    );
    return rows[0];
  }

  async getActiveReports() {
    const [rows] = await this.pool.execute(`
      SELECT r.*,
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'field', rf.field,
                 'type', rf.type,
                 'label', JSON_OBJECT('en', rf.label_en, 'si', rf.label_si),
                 'options', rf.options,
                 'defaultValue', rf.default_value
               )
             ) as filters,
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'field', rc.field,
                 'header', JSON_OBJECT('en', rc.header_en, 'si', rc.header_si),
                 'width', rc.width,
                 'sortable', rc.sortable,
                 'format', rc.format
               )
             ) as columns
      FROM reports r
      LEFT JOIN report_filters rf ON r.id = rf.report_id
      LEFT JOIN report_columns rc ON r.id = rc.report_id
      WHERE r.status = 'active'
      GROUP BY r.id
      ORDER BY r.category, r.name_en
    `);
    return rows;
  }

  async create(reportData) {
    const { filters, columns, ...report } = reportData;
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Insert report
      const columns = Object.keys(report);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(report);
      
      const [result] = await connection.execute(
        `INSERT INTO reports (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );
      const reportId = result.insertId;

      // Insert filters
      if (filters && filters.length) {
        for (const filter of filters) {
          await connection.execute(
            `INSERT INTO report_filters (
              report_id, field, type, label_en, 
              label_si, options, default_value
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              reportId,
              filter.field,
              filter.type,
              filter.label.en,
              filter.label.si,
              JSON.stringify(filter.options || null),
              filter.defaultValue || null
            ]
          );
        }
      }

      // Insert columns
      if (columns && columns.length) {
        for (const column of columns) {
          await connection.execute(
            `INSERT INTO report_columns (
              report_id, field, header_en, header_si,
              width, sortable, format
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              reportId,
              column.field,
              column.header.en,
              column.header.si,
              column.width || null,
              column.sortable || true,
              column.format || null
            ]
          );
        }
      }

      await connection.commit();
      return this.findById(reportId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async initializeTemplates() {
    const connection = await this.pool.getConnection();
    
    try {
      const [existingReports] = await connection.execute(
        'SELECT COUNT(*) as count FROM reports'
      );

      if (existingReports[0].count === 0) {
        await connection.beginTransaction();
        try {
          for (const template of reportTemplates) {
            // Insert report
            const [result] = await connection.execute(
              `INSERT INTO reports (
                code, name_en, name_si, category, 
                description_en, description_si, query, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                template.code,
                template.name.en,
                template.name.si,
                template.category,
                template.description.en,
                template.description.si,
                template.query || '',
                'active'
              ]
            );

            const reportId = result.insertId;

            // Insert filters
            if (template.filters) {
              for (const filter of template.filters) {
                await connection.execute(
                  `INSERT INTO report_filters (
                    report_id, field, type, label_en, 
                    label_si, options, default_value
                  ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    reportId,
                    filter.field,
                    filter.type,
                    filter.label.en,
                    filter.label.si,
                    JSON.stringify(filter.options || null),
                    filter.defaultValue || null
                  ]
                );
              }
            }

            // Insert columns
            if (template.columns) {
              for (const column of template.columns) {
                await connection.execute(
                  `INSERT INTO report_columns (
                    report_id, field, header_en, header_si,
                    width, sortable, format
                  ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    reportId,
                    column.field,
                    column.header.en,
                    column.header.si,
                    column.width || null,
                    column.sortable || true,
                    column.format || null
                  ]
                );
              }
            }
          }
          await connection.commit();
        } catch (error) {
          await connection.rollback();
          throw error;
        }
      }
    } finally {
      connection.release();
    }
  }
}

module.exports = new Report(); 