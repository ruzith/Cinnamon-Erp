const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Read and execute schema.sql
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );

    // Split the SQL file into individual statements
    const statements = schemaSQL
      .split(';')
      .filter(statement => statement.trim());

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    await connection.commit();
    console.log('Database migrations completed successfully!');
  } catch (error) {
    await connection.rollback();
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
};

// Run migrations
runMigrations(); 