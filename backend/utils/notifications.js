const pool = require('../config/db');

const createNotification = async (studentId, title, message, type = 'general') => {
  await pool.execute(
    'INSERT INTO Notifications (student_id, title, message, type) VALUES (?, ?, ?, ?)',
    [studentId, title, message, type]
  );
};

module.exports = { createNotification };
