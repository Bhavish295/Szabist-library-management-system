const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'library.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('SQLite connection failed:', err.message);
  } else {
    console.log('SQLite database connected successfully.');
  }
});

const pool = {
  execute(sql, params = []) {
    return new Promise((resolve, reject) => {
      const normalizedSql = sql
        .replace(/`/g, '')
        .replace(/\bNOW\(\)/gi, "datetime('now')");

      const isSelect =
        normalizedSql.trim().toUpperCase().startsWith('SELECT');

      if (isSelect) {
        db.all(normalizedSql, params, (err, rows) => {
          if (err) return reject(err);
          resolve([rows]);
        });
      } else {
        db.run(normalizedSql, params, function (err) {
          if (err) return reject(err);

          resolve([
            {
              insertId: this.lastID,
              affectedRows: this.changes,
            },
          ]);
        });
      }
    });
  },

  query(sql, params = []) {
    return this.execute(sql, params);
  },
};

module.exports = pool;