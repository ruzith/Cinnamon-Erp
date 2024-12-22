const BaseModel = require('../base/BaseModel');
const bcrypt = require('bcryptjs');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  async findAll() {
    const [rows] = await this.pool.execute(
      'SELECT id, name, email, role, department, status FROM users'
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
      'SELECT id, name, email, role, department, status FROM users WHERE id = ?',
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
      status,
      department: data.department || null
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

  async delete(id) {
    const user = await this.findById(id);
    if (!user) return null;

    // Instead of deleting, update status to inactive
    await this.pool.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      ['inactive', id]
    );
    
    return user;
  }
}

module.exports = new User(); 