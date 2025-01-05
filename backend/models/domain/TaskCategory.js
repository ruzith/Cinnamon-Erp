const BaseModel = require('../base/BaseModel');

class TaskCategory extends BaseModel {
  constructor() {
    super('task_categories');
  }

  async getAll() {
    const [rows] = await this.pool.execute(`
      SELECT
        tc.*,
        COUNT(t.id) as task_count
      FROM task_categories tc
      LEFT JOIN tasks t ON tc.id = t.category_id
      GROUP BY tc.id
      ORDER BY tc.name
    `);
    return rows;
  }

  async create(categoryData) {
    const columns = Object.keys(categoryData).join(', ');
    const placeholders = Object.keys(categoryData).map(() => '?').join(', ');
    const values = Object.values(categoryData);

    const [result] = await this.pool.execute(
      `INSERT INTO task_categories (${columns}) VALUES (${placeholders})`,
      values
    );

    return this.findById(result.insertId);
  }

  async update(id, categoryData) {
    const setClause = Object.keys(categoryData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(categoryData), id];

    await this.pool.execute(
      `UPDATE task_categories SET ${setClause} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id) {
    // Check if there are any tasks using this category
    const [tasks] = await this.pool.execute(`
      SELECT t.*
      FROM tasks t
      WHERE t.category_id = ?
    `, [id]);

    if (tasks.length > 0) {
      const error = new Error('Cannot delete category that has tasks assigned to it');
      error.hasTasks = true;
      error.tasks = tasks;
      throw error;
    }

    await this.pool.execute(
      'DELETE FROM task_categories WHERE id = ?',
      [id]
    );
  }
}

module.exports = new TaskCategory();