const BaseModel = require('../base/BaseModel');
const bcrypt = require('bcryptjs');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  async findAll() {
    const [rows] = await this.pool.execute(
      'SELECT id, name, email, role, status FROM users'
    );
    return rows;
  }

  async findByEmail(email) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  async findById(id) {
    const [rows] = await this.pool.execute(
      'SELECT id, name, email, role, status FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  async create(data) {
    const { password, ...otherData } = data;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set default role to 'staff' if not provided or invalid
    const validRoles = ['admin', 'staff', 'accountant', 'manager'];
    const role = validRoles.includes(data.role) ? data.role : 'staff';

    // Set default status to 'active' if not provided or invalid
    const validStatuses = ['active', 'inactive'];
    const status = validStatuses.includes(data.status) ? data.status : 'active';

    return super.create({
      ...otherData,
      password_hash: hashedPassword,
      role,
      status
    });
  }

  async validatePassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  async update(id, data) {
    // If password is being updated, hash it
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      data = {
        ...data,
        password_hash: hashedPassword
      };
      delete data.password;
    }

    // Validate role if it's being updated
    if (data.role) {
      const validRoles = ['admin', 'staff', 'accountant', 'manager'];
      data.role = validRoles.includes(data.role) ? data.role : 'staff';
    }

    // Validate status if it's being updated
    if (data.status) {
      const validStatuses = ['active', 'inactive'];
      data.status = validStatuses.includes(data.status) ? data.status : 'active';
    }

    // Fix: Use proper MySQL query format
    const keys = Object.keys(data);
    const values = Object.values(data);

    const setClause = keys.map(key => `${key} = ?`).join(', ');

    await this.pool.execute(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return this.findById(id);
  }

  async delete(id, permanent = false) {
    const user = await this.findById(id);
    if (!user) return null;

    if (permanent) {
      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();

        // Update transactions to set created_by to NULL
        await connection.execute(
          'UPDATE transactions SET created_by = NULL WHERE created_by = ?',
          [id]
        );

        // Update manufacturing_orders to set created_by to NULL
        await connection.execute(
          'UPDATE manufacturing_orders SET created_by = NULL WHERE created_by = ?',
          [id]
        );

        // Update sales_invoices to set created_by to NULL
        await connection.execute(
          'UPDATE sales_invoices SET created_by = NULL WHERE created_by = ?',
          [id]
        );

        // Update purchase_invoices to set created_by to NULL
        await connection.execute(
          'UPDATE purchase_invoices SET created_by = NULL WHERE created_by = ?',
          [id]
        );

        // Update payrolls to set created_by and approved_by to NULL
        await connection.execute(
          'UPDATE payrolls SET created_by = NULL, approved_by = CASE WHEN approved_by = ? THEN NULL ELSE approved_by END WHERE created_by = ? OR approved_by = ?',
          [id, id, id]
        );

        // Update customers to set created_by to NULL
        await connection.execute(
          'UPDATE customers SET created_by = NULL WHERE created_by = ?',
          [id]
        );

        // Update loans to set created_by to NULL
        await connection.execute(
          'UPDATE loans SET created_by = NULL WHERE created_by = ?',
          [id]
        );

        // Update loan_payments to set created_by to NULL
        await connection.execute(
          'UPDATE loan_payments SET created_by = NULL WHERE created_by = ?',
          [id]
        );

        // Update assets to set created_by to NULL
        await connection.execute(
          'UPDATE assets SET created_by = NULL WHERE created_by = ?',
          [id]
        );

        // Update asset_maintenance to set created_by to NULL
        await connection.execute(
          'UPDATE asset_maintenance SET created_by = NULL WHERE created_by = ?',
          [id]
        );

        // Update manufacturing_advance_payments to set created_by to NULL
        await connection.execute(
          'UPDATE manufacturing_advance_payments SET created_by = NULL WHERE created_by = ?',
          [id]
        );

        // Update tasks to set created_by, updated_by, and assigned_to to NULL
        await connection.execute(
          'UPDATE tasks SET created_by = NULL, updated_by = CASE WHEN updated_by = ? THEN NULL ELSE updated_by END, assigned_to = CASE WHEN assigned_to = ? THEN NULL ELSE assigned_to END WHERE created_by = ? OR updated_by = ? OR assigned_to = ?',
          [id, id, id, id, id]
        );

        // Finally delete the user
        await connection.execute(
          'DELETE FROM users WHERE id = ?',
          [id]
        );

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else {
      // Soft delete - update status to inactive
      await this.pool.execute(
        'UPDATE users SET status = ? WHERE id = ?',
        ['inactive', id]
      );
    }

    return user;
  }
}

module.exports = new User();