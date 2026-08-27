CREATE DATABASE IF NOT EXISTS szabist_library;
USE szabist_library;

CREATE TABLE IF NOT EXISTS Categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  is_blocked TINYINT(1) DEFAULT 0,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expiry DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Books (
  book_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(150) NOT NULL,
  category_id INT NOT NULL,
  isbn VARCHAR(20) UNIQUE,
  quantity INT NOT NULL DEFAULT 1,
  available_quantity INT NOT NULL DEFAULT 1,
  rack_no VARCHAR(20) NOT NULL,
  shelf_no VARCHAR(20) NOT NULL,
  description TEXT,
  cover_image VARCHAR(255),
  pdf_path VARCHAR(255),
  is_ebook TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Reservations (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  book_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'expired', 'cancelled', 'waitlisted') DEFAULT 'pending',
  reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATETIME NULL,
  FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS IssuedBooks (
  issue_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  book_id INT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE DEFAULT NULL,
  status ENUM('issued', 'returned', 'overdue') DEFAULT 'issued',
  renewal_count INT NOT NULL DEFAULT 0,
  FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Fines (
  fine_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  issue_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reason VARCHAR(255) DEFAULT 'Late return',
  status ENUM('pending', 'paid') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (issue_id) REFERENCES IssuedBooks(issue_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('due_date', 'reservation', 'fine', 'general') DEFAULT 'general',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE
);

-- Seed categories
INSERT INTO Categories (category_name) VALUES
  ('Computer Science'),
  ('Engineering'),
  ('Business'),
  ('Mathematics'),
  ('Literature'),
  ('Science'),
  ('History'),
  ('Law');

-- Run backend/scripts/seed.js after schema import for default admin & sample data
