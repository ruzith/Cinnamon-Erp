const BaseModel = require('../base/BaseModel');

class EmployeeGroup extends BaseModel {
  constructor() {
    super('employee_groups');
  }

  async getWithMembers(includeMembers = false) {
    let query = `
      SELECT g.*,
             COUNT(DISTINCT m.employee_id) as member_count
             ${includeMembers ? `,
             GROUP_CONCAT(DISTINCT e.id) as member_ids,
             GROUP_CONCAT(DISTINCT e.name) as member_names,
             GROUP_CONCAT(DISTINCT e.designation_id) as member_designation_ids,
             GROUP_CONCAT(DISTINCT d.title) as member_designation_titles` : ''}
      FROM employee_groups g
      LEFT JOIN employee_group_members m ON g.id = m.group_id
      ${includeMembers ? `
      LEFT JOIN employees e ON m.employee_id = e.id
      LEFT JOIN designations d ON e.designation_id = d.id` : ''}
      GROUP BY g.id
      ORDER BY g.name ASC
    `;

    const [groups] = await this.pool.execute(query);

    if (includeMembers) {
      return groups.map(group => ({
        ...group,
        members: group.member_ids ? group.member_ids.split(',').map((id, index) => ({
          id: parseInt(id),
          name: group.member_names.split(',')[index],
          designation_id: group.member_designation_ids ? parseInt(group.member_designation_ids.split(',')[index]) : null,
          designation_title: group.member_designation_titles ? group.member_designation_titles.split(',')[index] : null
        })) : []
      }));
    }

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