const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool(config.database);

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`MySQL Connected: ${config.database.host}`);
    connection.release();
    return pool;
  } catch (error) {
    console.error(`MySQL Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { pool, connectDB }; 