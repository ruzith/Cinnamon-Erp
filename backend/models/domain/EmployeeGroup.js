const BaseModel = require('../base/BaseModel');

class EmployeeGroup extends BaseModel {
  constructor() {
    super('employee_groups');
  }

  async getWithMembers() {
    const [groups] = await this.pool.execute(`
      SELECT g.*,
             COUNT(DISTINCT m.employee_id) as member_count
      FROM employee_groups g
      LEFT JOIN employee_group_members m ON g.id = m.group_id
      GROUP BY g.id
      ORDER BY g.name ASC
    `);

    return groups;
  }

  async getGroupMembers(groupId) {
    const [members] = await this.pool.execute(`
      SELECT e.*
      FROM employees e
      JOIN employee_group_members m ON e.id = m.employee_id
      WHERE m.group_id = ?
      ORDER BY e.name ASC
    `, [groupId]);

    return members;
  }

  async addMembers(groupId, employeeIds) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const employeeId of employeeIds) {
        await connection.execute(
          'INSERT IGNORE INTO employee_group_members (group_id, employee_id) VALUES (?, ?)',
          [groupId, employeeId]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async removeMembers(groupId, employeeIds) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create placeholders for the IN clause
      const placeholders = employeeIds.map(() => '?').join(',');

      await connection.execute(
        `DELETE FROM employee_group_members WHERE group_id = ? AND employee_id IN (${placeholders})`,
        [groupId, ...employeeIds]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new EmployeeGroup();