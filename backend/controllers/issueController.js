const pool = require('../config/db');
const { calculateFine, FINE_PER_DAY } = require('../utils/fines');
const { createNotification } = require('../utils/notifications');
const { sendEmail } = require('../utils/email');

const ISSUE_DAYS = parseInt(process.env.BOOK_ISSUE_DAYS || '14');

exports.getMyIssuedBooks = async (req, res) => {
  try {
    const [books] = await pool.execute(
      `SELECT ib.*, b.title, b.author, b.rack_no, b.shelf_no, c.category_name,
        DATEDIFF(CURDATE(), ib.due_date) as days_overdue
       FROM IssuedBooks ib
       JOIN Books b ON ib.book_id = b.book_id
       JOIN Categories c ON b.category_id = c.category_id
       WHERE ib.student_id = ?
       ORDER BY ib.issue_date DESC`,
      [req.user.id]
    );
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllIssuedBooks = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT ib.*, b.title, b.author, s.name as student_name, s.email
      FROM IssuedBooks ib
      JOIN Books b ON ib.book_id = b.book_id
      JOIN Students s ON ib.student_id = s.student_id
    `;
    const params = [];
    if (status) {
      sql += ' WHERE ib.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY ib.issue_date DESC';
    const [books] = await pool.execute(sql, params);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.issueBook = async (req, res) => {
  try {
    const { student_id, book_id, reservation_id } = req.body;

    const [student] = await pool.execute('SELECT * FROM Students WHERE student_id = ?', [student_id]);
    if (student.length === 0) return res.status(404).json({ message: 'Student not found.' });
    if (student[0].is_blocked) return res.status(400).json({ message: 'Student account is blocked.' });

    const [books] = await pool.execute('SELECT * FROM Books WHERE book_id = ?', [book_id]);
    if (books.length === 0) return res.status(404).json({ message: 'Book not found.' });
    if (books[0].available_quantity <= 0) {
      return res.status(400).json({ message: 'No copies available.' });
    }

    const [active] = await pool.execute(
      "SELECT issue_id FROM IssuedBooks WHERE student_id = ? AND book_id = ? AND status IN ('issued', 'overdue')",
      [student_id, book_id]
    );
    if (active.length > 0) {
      return res.status(400).json({ message: 'Student already has this book issued.' });
    }

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + ISSUE_DAYS);

    const [result] = await pool.execute(
      'INSERT INTO IssuedBooks (student_id, book_id, issue_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [student_id, book_id, issueDate, dueDate, 'issued']
    );

    await pool.execute('UPDATE Books SET available_quantity = available_quantity - 1 WHERE book_id = ?', [
      book_id,
    ]);

    if (reservation_id) {
      await pool.execute("UPDATE Reservations SET status = 'cancelled' WHERE reservation_id = ?", [
        reservation_id,
      ]);
    }

    await createNotification(
      student_id,
      'Book Issued',
      `"${books[0].title}" issued. Due date: ${dueDate.toLocaleDateString()}`,
      'general'
    );

    res.status(201).json({
      message: 'Book issued successfully.',
      issue_id: result.insertId,
      due_date: dueDate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { issue_id } = req.body;
    const [issues] = await pool.execute(
      `SELECT ib.*, b.title, s.email, s.name, s.student_id
       FROM IssuedBooks ib JOIN Books b ON ib.book_id = b.book_id
       JOIN Students s ON ib.student_id = s.student_id
       WHERE ib.issue_id = ?`,
      [issue_id]
    );
    if (issues.length === 0) return res.status(404).json({ message: 'Issue record not found.' });
    const issue = issues[0];
    if (issue.status === 'returned') {
      return res.status(400).json({ message: 'Book already returned.' });
    }

    const returnDate = new Date();
    const fineAmount = calculateFine(issue.due_date, returnDate);

    await pool.execute(
      'UPDATE IssuedBooks SET return_date = ?, status = ? WHERE issue_id = ?',
      [returnDate, 'returned', issue_id]
    );
    await pool.execute('UPDATE Books SET available_quantity = available_quantity + 1 WHERE book_id = ?', [
      issue.book_id,
    ]);

    if (fineAmount > 0) {
      await pool.execute(
        'INSERT INTO Fines (student_id, issue_id, amount, reason, status) VALUES (?, ?, ?, ?, ?)',
        [issue.student_id, issue_id, fineAmount, `Late return (${FINE_PER_DAY}/day)`, 'pending']
      );
      await createNotification(
        issue.student_id,
        'Fine Applied',
        `Late return fine of Rs. ${fineAmount} for "${issue.title}".`,
        'fine'
      );
      await sendEmail(
        issue.email,
        'Szabist Library - Fine Alert',
        `<p>Hello ${issue.name},</p><p>A fine of <strong>Rs. ${fineAmount}</strong> has been applied for late return of "${issue.title}".</p>`
      );
    }

    res.json({ message: 'Book returned successfully.', fine: fineAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};
