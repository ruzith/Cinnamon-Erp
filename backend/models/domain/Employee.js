const BaseModel = require('../base/BaseModel');

class Employee extends BaseModel {
  constructor() {
    super('employees');
  }

  async findByNIC(nic) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM employees WHERE nic = ?',
      [nic]
    );
    return rows[0];
  }

  async getWithDetails() {
    const [rows] = await this.pool.execute(`
      SELECT e.id,
             e.name,
             e.nic,
             e.phone,
             e.address,
             e.birthday,
             e.designation_id,
             e.employment_type,
             e.status,
             e.basic_salary,
             e.salary_type,
             e.bank_name,
             e.account_number,
             e.account_name,
             e.created_at,
             e.updated_at,
             d.title as designation_title,
             d.department,
             GROUP_CONCAT(DISTINCT eg.id) as group_ids,
             GROUP_CONCAT(DISTINCT eg.name) as group_names
      FROM employees e
      LEFT JOIN designations d ON e.designation_id = d.id
      LEFT JOIN employee_group_members egm ON e.id = egm.employee_id
      LEFT JOIN employee_groups eg ON egm.group_id = eg.id
      GROUP BY e.id
      ORDER BY e.name ASC
    `);
    return rows;
  }

  async getActiveEmployees() {
    const [rows] = await this.pool.execute(`
      SELECT e.id,
             e.name,
             e.nic,
             e.phone,
             e.address,
             e.birthday,
             e.designation_id,
             e.employment_type,
             e.status,
             e.basic_salary,
             e.salary_type,
             e.bank_name,
             e.account_number,
             e.account_name,
             e.created_at,
             e.updated_at,
             d.title as designation_title,
             d.department,
             GROUP_CONCAT(DISTINCT eg.id) as group_ids,
             GROUP_CONCAT(DISTINCT eg.name) as group_names
      FROM employees e
      LEFT JOIN designations d ON e.designation_id = d.id
      LEFT JOIN employee_group_members egm ON e.id = egm.employee_id
      LEFT JOIN employee_groups eg ON egm.group_id = eg.id
      WHERE e.status = 'active'
      GROUP BY e.id
      ORDER BY e.name ASC
    `);
    return rows;
  }

  async create(data) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const { group_ids, ...employeeData } = data;
      const columns = Object.keys(employeeData);
      const values = Object.values(employeeData);
      const placeholders = Array(values.length).fill('?').join(', ');

      const [result] = await connection.execute(
        `INSERT INTO employees (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );

      if (group_ids && group_ids.length > 0) {
        const values = group_ids.map(groupId => [groupId, result.insertId]);
        await connection.query(
          'INSERT INTO employee_group_members (group_id, employee_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      return this.findById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async update(id, data) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const { group_ids, ...employeeData } = data;

      // Create SET clause for each field
      const updateFields = Object.entries(employeeData)
        .map(([key, _]) => `${key} = ?`)
        .join(', ');
      const updateValues = [...Object.values(employeeData), id];

      await connection.execute(
        `UPDATE employees SET ${updateFields} WHERE id = ?`,
        updateValues
      );

      if (group_ids !== undefined) {
        // Remove existing group memberships
        await connection.execute(
          'DELETE FROM employee_group_members WHERE employee_id = ?',
          [id]
        );

        // Add new group memberships
        if (group_ids.length > 0) {
          const values = group_ids.map(groupId => [groupId, id]);
          await connection.query(
            'INSERT INTO employee_group_members (group_id, employee_id) VALUES ?',
            [values]
          );
        }
      }

      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Employee;