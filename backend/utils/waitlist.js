const pool = require('../config/db');
const { createNotification } = require('./notifications');
const { sendEmail } = require('./email');

const HOLD_HOURS = parseInt(process.env.RESERVATION_HOLD_HOURS || '24');

// Called whenever a copy of a book becomes available again (a return, or an
// admin raising the quantity). Promotes the longest-waiting student on the
// waitlist into an active, time-limited hold — mirroring what
// createReservation does for a normal reservation.
const promoteNextWaitlisted = async (bookId) => {
  const [books] = await pool.execute('SELECT available_quantity FROM Books WHERE book_id = ?', [bookId]);
  if (books.length === 0 || books[0].available_quantity <= 0) return;

  const [waiting] = await pool.execute(
    `SELECT r.*, s.name, s.email, b.title
     FROM Reservations r
     JOIN Students s ON r.student_id = s.student_id
     JOIN Books b ON r.book_id = b.book_id
     WHERE r.book_id = ? AND r.status = 'waitlisted'
     ORDER BY r.reservation_date ASC
     LIMIT 1`,
    [bookId]
  );
  if (waiting.length === 0) return;

  const resv = waiting[0];
  const expiry = new Date(Date.now() + HOLD_HOURS * 60 * 60 * 1000);

  await pool.execute("UPDATE Reservations SET status = 'pending', expiry_date = ? WHERE reservation_id = ?", [
    expiry,
    resv.reservation_id,
  ]);

  await createNotification(
    resv.student_id,
    'Your Hold Is Ready',
    `"${resv.title}" is now available! Your hold is active until ${expiry.toLocaleString()} — visit the library to collect it.`,
    'reservation'
  );
  await sendEmail(
    resv.email,
    'Szabist Library - Your Hold Is Ready',
    `<p>Hello ${resv.name},</p>
     <p>Good news — <strong>${resv.title}</strong> is now available. Your hold is active until ${expiry.toLocaleString()}.</p>`
  );
};

module.exports = { promoteNextWaitlisted };
