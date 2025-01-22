const BaseModel = require('../base/BaseModel');

class Task extends BaseModel {
  constructor() {
    super('tasks');
  }

  async getWithDetails(id) {
    const [rows] = await this.pool.execute(`
      SELECT t.*,
             e.name as assigned_to_name,
             u.name as created_by_name,
             tc.name as category_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN task_categories tc ON t.category_id = tc.id
      WHERE t.id = ?
    `, [id]);
    return rows[0];
  }

  async getAllTasks() {
    const [rows] = await this.pool.execute(`
      SELECT t.*,
             e.name as assigned_to_name,
             u.name as created_by_name,
             tc.name as category_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN task_categories tc ON t.category_id = tc.id
      ORDER BY t.created_at DESC
    `);
    return rows;
  }

  async create(taskData) {
    // Clean up empty values to be null
    const cleanedData = Object.fromEntries(
      Object.entries(taskData).map(([key, value]) => {
        if (value === '') {
          return [key, null];
        }
        return [key, value];
      })
    );

    const columns = Object.keys(cleanedData).join(', ');
    const placeholders = Object.keys(cleanedData).map(() => '?').join(', ');
    const values = Object.values(cleanedData);

    const [result] = await this.pool.execute(
      `INSERT INTO tasks (${columns}) VALUES (${placeholders})`,
      values
    );
    return this.getWithDetails(result.insertId);
  }

  async update(id, taskData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get current task data
      const [currentTask] = await connection.execute(
        'SELECT * FROM tasks WHERE id = ?',
        [id]
      );

      if (!currentTask[0]) {
        throw new Error('Task not found');
      }

      // Clean up empty values to be null
      const cleanedData = Object.fromEntries(
        Object.entries(taskData).map(([key, value]) => {
          if (value === '') {
            return [key, null];
          }
          return [key, value];
        })
      );

      // Update task
      const setClause = Object.keys(cleanedData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(cleanedData), id];

      await connection.execute(
        `UPDATE tasks SET ${setClause} WHERE id = ?`,
        values
      );

      // Record history if status has changed
      if (cleanedData.status && cleanedData.status !== currentTask[0].status) {
        await connection.execute(
          'INSERT INTO task_history (task_id, user_id, status, comments) VALUES (?, ?, ?, ?)',
          [id, cleanedData.updated_by || currentTask[0].created_by, cleanedData.status, cleanedData.comments || `Status changed to ${cleanedData.status}`]
        );
      }

      await connection.commit();
      return this.getWithDetails(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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

  async getTaskReport(taskId) {
    // Get task details with history
    const [[task]] = await this.pool.execute(`
      SELECT t.*,
             e.name as assigned_to_name,
             u.name as created_by_name,
             tc.name as category_name,
             CASE
               WHEN t.due_date IS NULL THEN NULL
               WHEN t.status = 'completed' THEN 0
               ELSE DATEDIFF(t.due_date, CURRENT_DATE())
             END as days_remaining,
             CASE
               WHEN t.status = 'completed' THEN 100
               WHEN t.status = 'in_progress' THEN 50
               WHEN t.status = 'cancelled' THEN 0
               ELSE 0
             END as progress
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN task_categories tc ON t.category_id = tc.id
      WHERE t.id = ?
    `, [taskId]);

    if (!task) {
      throw new Error('Task not found');
    }

    // Get task history from task_history table
    const [history] = await this.pool.execute(`
      SELECT
        th.*,
        u.name as updated_by
      FROM task_history th
      LEFT JOIN users u ON th.user_id = u.id
      WHERE th.task_id = ?
      ORDER BY th.created_at DESC
    `, [taskId]);

    const taskReport = {
      ...task,
      history: history || [],
      estimated_hours: task.estimated_hours ? parseFloat(task.estimated_hours) : 0,
      days_remaining: task.days_remaining !== null ? parseInt(task.days_remaining) : null,
      progress: parseInt(task.progress)
    };

    return taskReport;
  }
}

module.exports = new Task();