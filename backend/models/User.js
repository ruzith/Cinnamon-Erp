const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  async findAll() {
    const [rows] = await this.pool.execute(
      'SELECT id, name, email, role FROM users'
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
      'SELECT id, name, email, role FROM users WHERE id = ?',
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

    return super.create({
      ...otherData,
      password_hash: hashedPassword,
      role
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

    await this.pool.execute(
      'UPDATE users SET ? WHERE id = ?',
      [data, id]
    );
    
    return this.findById(id);
  }

  async delete(id) {
    const user = await this.findById(id);
    if (!user) return null;

    await this.pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    
    return user;
  }
}

module.exports = new User(); 