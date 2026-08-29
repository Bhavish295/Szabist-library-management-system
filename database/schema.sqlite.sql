PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Categories (
  category_id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Students (
  student_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  department TEXT NOT NULL,
  semester INTEGER NOT NULL,
  is_blocked INTEGER DEFAULT 0,
  reset_token TEXT DEFAULT NULL,
  reset_token_expiry TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Admins (
  admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Books (
  book_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  isbn TEXT UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  rack_no TEXT NOT NULL,
  shelf_no TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  pdf_path TEXT,
  is_ebook INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Reservations (
  reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  reservation_date TEXT DEFAULT (datetime('now')),
  expiry_date TEXT NULL,
  FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS IssuedBooks (
  issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  return_date TEXT DEFAULT NULL,
  status TEXT DEFAULT 'issued',
  renewal_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Fines (
  fine_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  issue_id INTEGER NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  reason TEXT DEFAULT 'Late return',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  paid_at TEXT NULL,
  FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (issue_id) REFERENCES IssuedBooks(issue_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Notifications (
  notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO Categories (category_id, category_name) VALUES
  (1, 'Computer Science'),
  (2, 'Engineering'),
  (3, 'Business'),
  (4, 'Mathematics'),
  (5, 'Literature'),
  (6, 'Science'),
  (7, 'History'),
  (8, 'Law');
