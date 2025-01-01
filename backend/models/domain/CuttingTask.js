const BaseModel = require('./BaseModel');

class CuttingTask extends BaseModel {
  constructor() {
    super('cutting_tasks');
  }

  async getTasksForAssignment(assignmentId) {
    const [rows] = await this.pool.execute(`
      SELECT ct.*,
             la.contractor_id,
             cc.name as contractor_name,
             l.land_number
      FROM cutting_tasks ct
      JOIN land_assignments la ON ct.assignment_id = la.id
      JOIN cutting_contractors cc ON la.contractor_id = cc.id
      JOIN lands l ON la.land_id = l.id
      WHERE ct.assignment_id = ?
      ORDER BY ct.date DESC
    `, [assignmentId]);
    return rows;
  }

  async getAllTasks() {
    const [rows] = await this.pool.execute(`
      SELECT ct.*,
             la.contractor_id,
             cc.name as contractor_name,
             l.land_number
      FROM cutting_tasks ct
      JOIN land_assignments la ON ct.assignment_id = la.id
      JOIN cutting_contractors cc ON la.contractor_id = cc.id
      JOIN lands l ON la.land_id = l.id
      ORDER BY ct.date DESC
    `);
    return rows;
  }

  async create(taskData) {
    const columns = Object.keys(taskData).join(', ');
    const placeholders = Object.keys(taskData).map(() => '?').join(', ');
    const values = Object.values(taskData);

    const [result] = await this.pool.execute(
      `INSERT INTO cutting_tasks (${columns}) VALUES (${placeholders})`,
      values
    );

    return this.findById(result.insertId);
  }

  async update(id, taskData) {
    const setClause = Object.keys(taskData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(taskData), id];

    await this.pool.execute(
      `UPDATE cutting_tasks SET ${setClause} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }
}

module.exports = new CuttingTask();