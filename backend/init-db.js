const pool = require('./config/db');

async function initDatabase() {
  try {
    console.log('Creating database tables...');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Students (
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        department TEXT NOT NULL,
        semester TEXT NOT NULL,
        is_blocked INTEGER DEFAULT 0,
        reset_token TEXT,
        reset_token_expiry TEXT
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Admins (
        admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Books (
        book_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT,
        isbn TEXT,
        category TEXT,
        quantity INTEGER DEFAULT 1,
        available_quantity INTEGER DEFAULT 1
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Reservations (
        reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        book_id INTEGER,
        status TEXT DEFAULT 'pending',
        reserved_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Issues (
        issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        book_id INTEGER,
        issue_date TEXT DEFAULT CURRENT_TIMESTAMP,
        due_date TEXT,
        return_date TEXT,
        status TEXT DEFAULT 'issued'
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Fines (
        fine_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        issue_id INTEGER,
        amount REAL DEFAULT 0,
        status TEXT DEFAULT 'unpaid',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Notifications (
        notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully.');
    process.exit(0);

  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();