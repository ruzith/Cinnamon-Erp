const BaseModel = require('./BaseModel');

class Task extends BaseModel {
  constructor() {
    super('tasks');
  }

  async getWithDetails(id) {
    const [rows] = await this.pool.execute(`
      SELECT t.*,
             u1.name as assigned_to_name,
             u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = ?
    `, [id]);
    return rows[0];
  }

  async getAllTasks() {
    const [rows] = await this.pool.execute(`
      SELECT t.*,
             u1.name as assigned_to_name,
             u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      ORDER BY t.created_at DESC
    `);
    return rows;
  }

  async create(taskData) {
    const [result] = await this.pool.execute(
      'INSERT INTO tasks SET ?',
      taskData
    );
    return this.getWithDetails(result.insertId);
  }

  async update(id, taskData) {
    await this.pool.execute(
      'UPDATE tasks SET ? WHERE id = ?',
      [taskData, id]
    );
    return this.getWithDetails(id);
  }
}

module.exports = new Task(); 