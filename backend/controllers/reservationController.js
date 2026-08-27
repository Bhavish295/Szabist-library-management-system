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

    const [duplicate] = await pool.execute(
      `SELECT reservation_id FROM Reservations
       WHERE student_id = ? AND book_id = ? AND status IN ('pending', 'approved', 'waitlisted')`,
      [studentId, book_id]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ message: 'You already have an active reservation or hold for this book.' });
    }

    const [studentInfo] = await pool.execute('SELECT name, email FROM Students WHERE student_id = ?', [studentId]);

    // If copies exist AND nobody is already waiting, grant an immediate hold.
    // Otherwise join the waitlist behind whoever is already there, so a
    // returned copy can't be jumped ahead of an existing queue.
    const [queueAhead] = await pool.execute(
      "SELECT COUNT(*) as count FROM Reservations WHERE book_id = ? AND status = 'waitlisted'",
      [book_id]
    );
    const canHoldNow = books[0].available_quantity > 0 && queueAhead[0].count === 0;

    if (canHoldNow) {
      const expiry = new Date(Date.now() + HOLD_HOURS * 60 * 60 * 1000);
      const [result] = await pool.execute(
        'INSERT INTO Reservations (student_id, book_id, status, expiry_date) VALUES (?, ?, ?, ?)',
        [studentId, book_id, 'pending', expiry]
      );

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

      return res.status(201).json({
        message: 'Reservation submitted successfully.',
        reservation_id: result.insertId,
        expiry_date: expiry,
        waitlisted: false,
      });
    }

    const [result] = await pool.execute(
      "INSERT INTO Reservations (student_id, book_id, status, expiry_date) VALUES (?, ?, 'waitlisted', NULL)",
      [studentId, book_id]
    );
    const position = queueAhead[0].count + 1;

    await createNotification(
      studentId,
      'Added to Waitlist',
      `"${books[0].title}" has no copies available right now. You're #${position} in line — we'll notify you the moment a copy frees up.`,
      'reservation'
    );

    res.status(201).json({
      message: `No copies available — you've joined the waitlist at position #${position}. We'll email you when it's your turn.`,
      reservation_id: result.insertId,
      waitlisted: true,
      position,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const [reservations] = await pool.execute(
      `SELECT r.*, b.title, b.author, b.rack_no, b.shelf_no, c.category_name,
        (SELECT COUNT(*) FROM Reservations r2
          WHERE r2.book_id = r.book_id AND r2.status = 'waitlisted'
            AND (r2.reservation_date < r.reservation_date
                 OR (r2.reservation_date = r.reservation_date AND r2.reservation_id <= r.reservation_id))
        ) as queue_position
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

exports.cancelMyReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const [reservations] = await pool.execute('SELECT * FROM Reservations WHERE reservation_id = ?', [id]);
    if (reservations.length === 0) return res.status(404).json({ message: 'Reservation not found.' });
    const resv = reservations[0];

    if (resv.student_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own reservations.' });
    }
    if (!['pending', 'waitlisted'].includes(resv.status)) {
      return res.status(400).json({ message: 'Only pending or waitlisted reservations can be cancelled.' });
    }

    await pool.execute("UPDATE Reservations SET status = 'cancelled' WHERE reservation_id = ?", [id]);
    res.json({ message: 'Reservation cancelled.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllReservations = async (req, res) => {
  try {
    const { status } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];
    if (status) {
      where = ' WHERE r.status = ?';
      params.push(status);
    }

    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM Reservations r${where}`, params);
    const total = countRows[0].total;

    const [reservations] = await pool.execute(
      `SELECT r.*, b.title, b.author, s.name as student_name, s.email as student_email
       FROM Reservations r
       JOIN Books b ON r.book_id = b.book_id
       JOIN Students s ON r.student_id = s.student_id
       ${where}
       ORDER BY r.reservation_date DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ reservations, pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
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
      WHERE status IN ('pending', 'approved') AND expiry_date IS NOT NULL AND expiry_date < NOW()
    `);
    res.json({ message: `${result.affectedRows} expired reservations cancelled.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
