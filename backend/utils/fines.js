const pool = require('../config/db');

const FINE_PER_DAY = parseFloat(process.env.FINE_PER_DAY || '50');

const calculateFine = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const ret = new Date(returnDate);
  due.setHours(0, 0, 0, 0);
  ret.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((ret - due) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 0;
  return diffDays * FINE_PER_DAY;
};

const processOverdueBooks = async () => {
  const [overdue] = await pool.execute(`
    SELECT ib.*, s.email, s.name, b.title
    FROM IssuedBooks ib
    JOIN Students s ON ib.student_id = s.student_id
    JOIN Books b ON ib.book_id = b.book_id
    WHERE ib.status = 'issued' AND ib.due_date < CURDATE()
  `);

  for (const book of overdue) {
    await pool.execute("UPDATE IssuedBooks SET status = 'overdue' WHERE issue_id = ?", [book.issue_id]);

    const fineAmount = calculateFine(book.due_date);
    const [existing] = await pool.execute(
      "SELECT fine_id FROM Fines WHERE issue_id = ? AND status = 'pending'",
      [book.issue_id]
    );

    if (existing.length === 0 && fineAmount > 0) {
      await pool.execute(
        'INSERT INTO Fines (student_id, issue_id, amount, reason, status) VALUES (?, ?, ?, ?, ?)',
        [book.student_id, book.issue_id, fineAmount, 'Late return - overdue book', 'pending']
      );
    } else if (existing.length > 0) {
      await pool.execute('UPDATE Fines SET amount = ? WHERE issue_id = ? AND status = ?', [
        fineAmount,
        book.issue_id,
        'pending',
      ]);
    }
  }
};

const expireReservations = async () => {
  await pool.execute(`
    UPDATE Reservations
    SET status = 'expired'
    WHERE status IN ('pending', 'approved') AND expiry_date < NOW()
  `);
};

module.exports = { calculateFine, processOverdueBooks, expireReservations, FINE_PER_DAY };
