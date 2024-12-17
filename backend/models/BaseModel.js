const { pool } = require('../config/db');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  async findAll(options = {}) {
    const { where = '', params = [], limit, offset, orderBy } = options;
    let query = `SELECT * FROM ${this.tableName}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
      if (offset) {
        query += ` OFFSET ${offset}`;
      }
    }

    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await this.pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
    `;

    const [result] = await this.pool.execute(query, values);
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = ?
    `;

    await this.pool.execute(query, [...values, id]);
    return this.findById(id);
  }

  async delete(id) {
    await this.pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return true;
  }
}

module.exports = BaseModel; 