const pool = require('../config/db');

exports.getAllStudents = async (req, res) => {
  try {
    const { q } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];
    if (q) {
      where = ' WHERE name LIKE ? OR email LIKE ?';
      params.push(`%${q}%`, `%${q}%`);
    }

    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM Students${where}`, params);
    const total = countRows[0].total;

    const [students] = await pool.execute(
      `SELECT student_id, name, email, department, semester, is_blocked, created_at
       FROM Students${where} ORDER BY name LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ students, pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.toggleBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const [students] = await pool.execute('SELECT is_blocked FROM Students WHERE student_id = ?', [id]);
    if (students.length === 0) return res.status(404).json({ message: 'Student not found.' });

    const newStatus = students[0].is_blocked ? 0 : 1;
    await pool.execute('UPDATE Students SET is_blocked = ? WHERE student_id = ?', [newStatus, id]);
    res.json({ message: newStatus ? 'Student blocked.' : 'Student unblocked.', is_blocked: newStatus });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [issued] = await pool.execute(
      "SELECT COUNT(*) as count FROM IssuedBooks WHERE student_id = ? AND status IN ('issued', 'overdue')",
      [studentId]
    );
    const [reserved] = await pool.execute(
      "SELECT COUNT(*) as count FROM Reservations WHERE student_id = ? AND status IN ('pending', 'approved')",
      [studentId]
    );
    const [fines] = await pool.execute(
      "SELECT COALESCE(SUM(amount), 0) as total FROM Fines WHERE student_id = ? AND status = 'pending'",
      [studentId]
    );
    const [dueSoon] = await pool.execute(
      `SELECT ib.*, b.title FROM IssuedBooks ib JOIN Books b ON ib.book_id = b.book_id
       WHERE ib.student_id = ? AND ib.status IN ('issued', 'overdue')
       AND ib.due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
       ORDER BY ib.due_date ASC`,
      [studentId]
    );
    const [recentIssued] = await pool.execute(
      `SELECT ib.*, b.title, b.author FROM IssuedBooks ib JOIN Books b ON ib.book_id = b.book_id
       WHERE ib.student_id = ? ORDER BY ib.issue_date DESC LIMIT 5`,
      [studentId]
    );

    res.json({
      issued_count: issued[0].count,
      reserved_count: reserved[0].count,
      pending_fines: fines[0].total,
      due_soon: dueSoon,
      recent_issued: recentIssued,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const [books] = await pool.execute(`
      SELECT COUNT(*) as total,
        SUM(available_quantity) as available,
        SUM(quantity - available_quantity) as issued_copies
      FROM Books
    `);
    const [reserved] = await pool.execute(
      "SELECT COUNT(*) as count FROM Reservations WHERE status IN ('pending', 'approved')"
    );
    const [students] = await pool.execute('SELECT COUNT(*) as count FROM Students');
    const [activeIssues] = await pool.execute(
      "SELECT COUNT(*) as count FROM IssuedBooks WHERE status IN ('issued', 'overdue')"
    );
    const [fineStats] = await pool.execute(`
      SELECT COALESCE(SUM(CASE WHEN status='pending' THEN amount ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END), 0) as collected
      FROM Fines
    `);
    const [recentReservations] = await pool.execute(`
      SELECT r.*, b.title, s.name as student_name
      FROM Reservations r JOIN Books b ON r.book_id = b.book_id
      JOIN Students s ON r.student_id = s.student_id
      ORDER BY r.reservation_date DESC LIMIT 5
    `);
    const [categoryStats] = await pool.execute(`
      SELECT c.category_name, COUNT(b.book_id) as book_count
      FROM Categories c LEFT JOIN Books b ON c.category_id = b.category_id
      GROUP BY c.category_id ORDER BY book_count DESC
    `);

    res.json({
      total_books: books[0].total,
      available_books: books[0].available,
      issued_books: activeIssues[0].count,
      reserved_books: reserved[0].count,
      total_students: students[0].count,
      fine_pending: fineStats[0].pending,
      fine_collected: fineStats[0].collected,
      recent_reservations: recentReservations,
      category_stats: categoryStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};
