const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const [notifications] = await pool.execute(
      'SELECT * FROM Notifications WHERE student_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await pool.execute(
      'UPDATE Notifications SET is_read = 1 WHERE notification_id = ? AND student_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await pool.execute('UPDATE Notifications SET is_read = 1 WHERE student_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM Notifications WHERE student_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ count: result[0].count });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
