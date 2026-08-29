const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let db;
let initPromise;

const resolveDbFile = () => {
  const raw = process.env.DB_FILE || path.join('data', 'library.sqlite');
  return path.isAbsolute(raw) ? raw : path.join(__dirname, '..', raw);
};

const mysqlToSqlite = (sql) => {
  let s = sql;
  s = s.replace(/INSERT IGNORE/gi, 'INSERT OR IGNORE');
  s = s.replace(
    /DATEDIFF\s*\(\s*CURDATE\s*\(\s*\)\s*,\s*([^)]+)\)/gi,
    "CAST(julianday('now') - julianday($1) AS INTEGER)"
  );
  s = s.replace(
    /DATE_ADD\s*\(\s*CURDATE\s*\(\s*\)\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi,
    "date('now', '+$1 days')"
  );
  s = s.replace(
    /DATE_SUB\s*\(\s*CURDATE\s*\(\s*\)\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi,
    "date('now', '-$1 days')"
  );
  s = s.replace(/CURDATE\s*\(\s*\)/gi, "date('now')");
  s = s.replace(/NOW\s*\(\s*\)/gi, "datetime('now')");
  return s;
};

const toParam = (value) => {
  if (value === undefined) return null;
  if (value instanceof Date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(
      value.getHours()
    )}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }
  return value;
};

const persist = () => {
  if (!db) return;
  const file = resolveDbFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(db.export()));
};

const applySchema = () => {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sqlite.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  persist();
};

const initDatabase = () => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file) => path.join(path.dirname(require.resolve('sql.js')), file),
    });
    const file = resolveDbFile();
    if (fs.existsSync(file) && fs.statSync(file).size > 0) {
      db = new SQL.Database(fs.readFileSync(file));
    } else {
      db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON');
    const tables = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='Students'"
    );
    if (!tables.length || !tables[0].values.length) {
      applySchema();
    }
    console.log(`SQLite database ready (${file}).`);
  })();
  return initPromise;
};

const execute = async (sql, params = []) => {
  await initDatabase();
  const translated = mysqlToSqlite(sql);
  const bind = (Array.isArray(params) ? params : []).map(toParam);
  const trimmed = translated.trim();
  const isQuery = /^(SELECT|WITH|PRAGMA)\b/i.test(trimmed);

  if (isQuery) {
    const stmt = db.prepare(translated);
    if (bind.length) stmt.bind(bind);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return [rows];
  }

  db.run(translated, bind);
  const insertId = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
  const affectedRows = db.getRowsModified();
  persist();
  return [{ insertId, affectedRows }];
};

initDatabase().catch((err) => {
  console.error('SQLite connection failed:', err.message);
});

module.exports = { execute, initDatabase };
