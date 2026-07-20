const pool = require('../config/db');
const { createNotification } = require('../utils/notifications');
const { sendEmail } = require('../utils/email');

const HOLD_HOURS = parseInt(process.env.RESERVATION_HOLD_HOURS || '24');

exports.createReservation = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { book_id } = req.body;

    const [student] = await pool.execute('SELECT is_blocked FROM Students WHERE student_id = ?', [studentId]);
    if (student[0]?.is_blocked) {
      return res.status(403).json({ message: 'Your account is blocked.' });
    }

    const [books] = await pool.execute('SELECT * FROM Books WHERE book_id = ?', [book_id]);
    if (books.length === 0) return res.status(404).json({ message: 'Book not found.' });
    if (books[0].available_quantity <= 0) {
      return res.status(400).json({ message: 'Book is currently unavailable.' });
    }

    const [duplicate] = await pool.execute(
      `SELECT reservation_id FROM Reservations
       WHERE student_id = ? AND book_id = ? AND status IN ('pending', 'approved')`,
      [studentId, book_id]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ message: 'You already have an active reservation for this book.' });
    }

    const expiry = new Date(Date.now() + HOLD_HOURS * 60 * 60 * 1000);
    const [result] = await pool.execute(
      'INSERT INTO Reservations (student_id, book_id, status, expiry_date) VALUES (?, ?, ?, ?)',
      [studentId, book_id, 'pending', expiry]
    );

    const [studentInfo] = await pool.execute('SELECT name, email FROM Students WHERE student_id = ?', [studentId]);
    await createNotification(
      studentId,
      'Reservation Submitted',
      `Your reservation for "${books[0].title}" is pending approval. Valid for ${HOLD_HOURS} hours.`,
      'reservation'
    );

    await sendEmail(
      studentInfo[0].email,
      'Szabist Library - Reservation Confirmation',
      `<p>Hello ${studentInfo[0].name},</p>
       <p>Your reservation for <strong>${books[0].title}</strong> has been submitted and is pending librarian approval.</p>
       <p>Reservation expires: ${expiry.toLocaleString()}</p>`
    );

    res.status(201).json({
      message: 'Reservation submitted successfully.',
      reservation_id: result.insertId,
      expiry_date: expiry,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const [reservations] = await pool.execute(
      `SELECT r.*, b.title, b.author, b.rack_no, b.shelf_no, c.category_name
       FROM Reservations r
       JOIN Books b ON r.book_id = b.book_id
       JOIN Categories c ON b.category_id = c.category_id
       WHERE r.student_id = ?
       ORDER BY r.reservation_date DESC`,
      [req.user.id]
    );
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllReservations = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT r.*, b.title, b.author, s.name as student_name, s.email as student_email
      FROM Reservations r
      JOIN Books b ON r.book_id = b.book_id
      JOIN Students s ON r.student_id = s.student_id
    `;
    const params = [];
    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY r.reservation_date DESC';
    const [reservations] = await pool.execute(sql, params);
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.approveReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const [reservations] = await pool.execute(
      `SELECT r.*, b.title, b.available_quantity, s.email, s.name
       FROM Reservations r JOIN Books b ON r.book_id = b.book_id
       JOIN Students s ON r.student_id = s.student_id
       WHERE r.reservation_id = ?`,
      [id]
    );
    if (reservations.length === 0) return res.status(404).json({ message: 'Reservation not found.' });

    const resv = reservations[0];
    if (resv.status !== 'pending') {
      return res.status(400).json({ message: 'Reservation is not pending.' });
    }
    if (new Date(resv.expiry_date) < new Date()) {
      await pool.execute("UPDATE Reservations SET status = 'expired' WHERE reservation_id = ?", [id]);
      return res.status(400).json({ message: 'Reservation has expired.' });
    }
    if (resv.available_quantity <= 0) {
      return res.status(400).json({ message: 'Book is no longer available.' });
    }

    await pool.execute("UPDATE Reservations SET status = 'approved' WHERE reservation_id = ?", [id]);
    await createNotification(
      resv.student_id,
      'Reservation Approved',
      `Your reservation for "${resv.title}" has been approved. Visit the library to collect it.`,
      'reservation'
    );
    await sendEmail(
      resv.email,
      'Szabist Library - Reservation Approved',
      `<p>Hello ${resv.name},</p><p>Your reservation for <strong>${resv.title}</strong> has been approved!</p>`
    );

    res.json({ message: 'Reservation approved.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.rejectReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const [reservations] = await pool.execute(
      `SELECT r.*, b.title, s.email, s.name, s.student_id
       FROM Reservations r JOIN Books b ON r.book_id = b.book_id
       JOIN Students s ON r.student_id = s.student_id
       WHERE r.reservation_id = ?`,
      [id]
    );
    if (reservations.length === 0) return res.status(404).json({ message: 'Reservation not found.' });

    await pool.execute("UPDATE Reservations SET status = 'rejected' WHERE reservation_id = ?", [id]);
    const resv = reservations[0];
    await createNotification(
      resv.student_id,
      'Reservation Rejected',
      `Your reservation for "${resv.title}" was rejected.`,
      'reservation'
    );
    res.json({ message: 'Reservation rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.cancelExpired = async (req, res) => {
  try {
    const [result] = await pool.execute(`
      UPDATE Reservations SET status = 'expired'
      WHERE status IN ('pending', 'approved') AND expiry_date < NOW()
    `);
    res.json({ message: `${result.affectedRows} expired reservations cancelled.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
