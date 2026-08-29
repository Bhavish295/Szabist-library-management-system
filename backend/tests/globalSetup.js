// Rebuilds a throwaway SQLite file from schema.sqlite.sql and seeds
// the librarian account every test file needs.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

module.exports = async () => {
  const dbFile = path.isAbsolute(process.env.DB_FILE)
    ? process.env.DB_FILE
    : path.join(__dirname, '..', process.env.DB_FILE || path.join('data', 'library.test.sqlite'));

  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
  }

  const { initDatabase, execute } = require('../config/db');
  await initDatabase();
  const adminHash = await bcrypt.hash('admin123', 10);
  await execute('INSERT INTO Admins (username, password) VALUES (?, ?)', ['admin', adminHash]);
};
