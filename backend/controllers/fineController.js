const pool = require('../config/db');

exports.getMyFines = async (req, res) => {
  try {
    const [fines] = await pool.execute(
      `SELECT f.*, b.title as book_title, ib.due_date, ib.return_date
       FROM Fines f
       JOIN IssuedBooks ib ON f.issue_id = ib.issue_id
       JOIN Books b ON ib.book_id = b.book_id
       WHERE f.student_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(fines);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllFines = async (req, res) => {
  try {
    const { status } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];
    if (status) {
      where = ' WHERE f.status = ?';
      params.push(status);
    }

    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM Fines f${where}`, params);
    const total = countRows[0].total;

    const [fines] = await pool.execute(
      `SELECT f.*, s.name as student_name, s.email, b.title as book_title
       FROM Fines f
       JOIN Students s ON f.student_id = s.student_id
       JOIN IssuedBooks ib ON f.issue_id = ib.issue_id
       JOIN Books b ON ib.book_id = b.book_id
       ${where}
       ORDER BY f.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ fines, pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.markFinePaid = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("UPDATE Fines SET status = 'paid', paid_at = NOW() WHERE fine_id = ?", [id]);
    res.json({ message: 'Fine marked as paid.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getFineStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT
        COUNT(*) as total_fines,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as collected_amount,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM Fines
    `);
    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
