const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const generateEmployees = async (connection, count = 10) => {
  // First get all designations and salary structures
  const [designations] = await connection.query('SELECT id FROM designations');
  const [salaryStructures] = await connection.query('SELECT id FROM salary_structures');
  
  return Array.from({ length: count }, () => {
    const designation_id = faker.helpers.arrayElement(designations).id;
    const salary_structure_id = faker.helpers.arrayElement(salaryStructures).id;

    // Generate a phone number in the format: 077XXXXXXX (10 digits)
    const phone = `077${faker.string.numeric(7)}`;

    return {
      name: faker.person.fullName(),
      nic: faker.helpers.replaceSymbols('#########V'),
      phone,
      address: faker.location.streetAddress(),
      birthday: faker.date.past({ years: 50, refDate: new Date('2000-01-01') }).toISOString().split('T')[0],
      designation_id,
      employment_type: faker.helpers.arrayElement(['permanent', 'temporary']),
      status: faker.helpers.arrayElement(['active', 'inactive']),
      salary_structure_id,
      bank_name: faker.company.name(),
      account_number: faker.finance.accountNumber(10), // Limit account number length
      account_name: faker.person.fullName()
    };
  });
};

const seedData = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Clear existing data
    await connection.query('DELETE FROM employees');
    await connection.query('DELETE FROM salary_structures');
    await connection.query('DELETE FROM designations');
    await connection.query('DELETE FROM users');
    
    console.log('Data cleared...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Admin User', 'admin@example.com', hashedPassword, 'admin']
    );
    console.log('Admin user created...');

    // Seed Designations
    const designations = [
      { title: 'Manager', department: 'Management', description: 'Oversees operations' },
      { title: 'Supervisor', department: 'Operations', description: 'Supervises field work' },
      { title: 'Field Worker', department: 'Operations', description: 'Performs field tasks' },
      { title: 'Accountant', department: 'Finance', description: 'Handles financial records' },
      { title: 'HR Officer', department: 'Human Resources', description: 'Manages personnel' }
    ];

    for (const designation of designations) {
      await connection.query('INSERT INTO designations SET ?', designation);
    }
    console.log('Designations seeded...');

    // Seed Salary Structures
    const salaryStructures = [
      { name: 'Manager Level', basic_salary: 100000.00, description: 'For management positions' },
      { name: 'Supervisor Level', basic_salary: 75000.00, description: 'For supervisory positions' },
      { name: 'Staff Level', basic_salary: 50000.00, description: 'For general staff' },
      { name: 'Entry Level', basic_salary: 35000.00, description: 'For new employees' }
    ];

    for (const structure of salaryStructures) {
      await connection.query('INSERT INTO salary_structures SET ?', structure);
    }
    console.log('Salary structures seeded...');

    // Seed Employees
    const employees = await generateEmployees(connection);
    for (const employee of employees) {
      await connection.query('INSERT INTO employees SET ?', employee);
    }
    console.log('Employees seeded...');

    await connection.commit();
    console.log('All data seeded successfully!');
  } catch (error) {
    await connection.rollback();
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
};

seedData().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}); 