const BaseModel = require('../base/BaseModel');

class Task extends BaseModel {
  constructor() {
    super('tasks');
  }

  async getWithDetails(id) {
    const [rows] = await this.pool.execute(`
      SELECT t.*,
             e.name as assigned_to_name,
             u.name as created_by_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `, [id]);
    return rows[0];
  }

  async getAllTasks() {
    const [rows] = await this.pool.execute(`
      SELECT t.*,
             e.name as assigned_to_name,
             u.name as created_by_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `);
    return rows;
  }

  async create(taskData) {
    const columns = Object.keys(taskData).join(', ');
    const placeholders = Object.keys(taskData).map(() => '?').join(', ');
    const values = Object.values(taskData);

    const [result] = await this.pool.execute(
      `INSERT INTO tasks (${columns}) VALUES (${placeholders})`,
      values
    );
    return this.getWithDetails(result.insertId);
  }

  async update(id, taskData) {
    const setClause = Object.keys(taskData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(taskData), id];

    await this.pool.execute(
      `UPDATE tasks SET ${setClause} WHERE id = ?`,
      values
    );
    return this.getWithDetails(id);
  }

  async delete(id) {
    const task = await this.getWithDetails(id);
    if (!task) {
      throw new Error('Task not found');
    }

    await this.pool.execute(
      'DELETE FROM tasks WHERE id = ?',
      [id]
    );
    return task;
  }
}

module.exports = new Task(); 