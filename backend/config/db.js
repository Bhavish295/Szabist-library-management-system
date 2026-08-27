const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'szabist_library',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

pool
  .getConnection()
  .then((conn) => {
    console.log('MySQL database connected successfully.');
    conn.release();
  })
  .catch((err) => {
    console.error('MySQL connection failed:', err.message);
  });

module.exports = pool;
