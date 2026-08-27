// Runs once, before any test file, in Jest's main process. Rebuilds a
// throwaway test database from the real schema.sql (so the schema tests
// run against never drifts from what the app actually ships) and seeds
// the one fixture every test file needs: a librarian account.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

module.exports = async () => {
  const dbName = process.env.DB_NAME;
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);

  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8').replace(/szabist_library/g, dbName);
  await conn.query(schema);

  await conn.query(`USE \`${dbName}\`;`);
  const adminHash = await bcrypt.hash('admin123', 10);
  await conn.query('INSERT INTO Admins (username, password) VALUES (?, ?)', ['admin', adminHash]);

  await conn.end();
};
