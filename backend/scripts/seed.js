const bcrypt = require('bcryptjs');
const pool = require('../config/db');
require('dotenv').config();

const seed = async () => {
  try {
    const adminPass = await bcrypt.hash('admin123', 10);
    await pool.execute(
      'INSERT IGNORE INTO Admins (username, password) VALUES (?, ?)',
      ['admin', adminPass]
    );

    const studentPass = await bcrypt.hash('student123', 10);
    await pool.execute(
      `INSERT IGNORE INTO Students (name, email, password, department, semester)
       VALUES (?, ?, ?, ?, ?)`,
      ['Ahmed Khan', 'ahmed@szabist.edu.pk', studentPass, 'Computer Science', 6]
    );
    await pool.execute(
      `INSERT IGNORE INTO Students (name, email, password, department, semester)
       VALUES (?, ?, ?, ?, ?)`,
      ['Sara Ali', 'sara@szabist.edu.pk', studentPass, 'Business Administration', 4]
    );

    const books = [
      ['Introduction to Algorithms', 'Thomas Cormen', 1, '978-0262033848', 5, 'A1', 'S3', 'Comprehensive guide to algorithms', 1],
      ['Clean Code', 'Robert Martin', 1, '978-0132350884', 3, 'A1', 'S4', 'A handbook of agile software craftsmanship', 0],
      ['Database System Concepts', 'Abraham Silberschatz', 1, '978-0078022159', 4, 'A2', 'S1', 'Fundamentals of database systems', 1],
      ['Principles of Economics', 'Gregory Mankiw', 3, '978-1305585126', 2, 'B1', 'S2', 'Micro and macro economics', 0],
      ['Calculus: Early Transcendentals', 'James Stewart', 4, '978-1285741550', 3, 'C1', 'S1', 'Calculus textbook', 1],
      ['To Kill a Mockingbird', 'Harper Lee', 5, '978-0061120084', 2, 'D1', 'S5', 'Classic American literature', 0],
      ['A Brief History of Time', 'Stephen Hawking', 6, '978-0553380163', 2, 'E1', 'S2', 'Cosmology for general readers', 1],
      ['Corporate Finance', 'Stephen Ross', 3, '978-0077861759', 3, 'B2', 'S3', 'Corporate finance principles', 0],
    ];

    for (const book of books) {
      const [existing] = await pool.execute('SELECT book_id FROM Books WHERE isbn = ?', [book[3]]);
      if (existing.length === 0) {
        await pool.execute(
          `INSERT INTO Books (title, author, category_id, isbn, quantity, available_quantity, rack_no, shelf_no, description, is_ebook)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [book[0], book[1], book[2], book[3], book[4], book[4], book[5], book[6], book[7], book[8]]
        );
      }
    }

    console.log('Seed completed successfully!');
    console.log('Admin: username=admin, password=admin123');
    console.log('Student: email=ahmed@szabist.edu.pk, password=student123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
