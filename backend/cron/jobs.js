const cron = require('node-cron');
const pool = require('../config/db');
const { processOverdueBooks, expireReservations } = require('../utils/fines');
const { createNotification } = require('../utils/notifications');
const { sendEmail } = require('../utils/email');

const sendDueDateReminders = async () => {
  const [dueSoon] = await pool.execute(`
    SELECT ib.*, b.title, s.email, s.name, s.student_id
    FROM IssuedBooks ib
    JOIN Books b ON ib.book_id = b.book_id
    JOIN Students s ON ib.student_id = s.student_id
    WHERE ib.status IN ('issued', 'overdue')
    AND ib.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY)
  `);

  for (const book of dueSoon) {
    const daysLeft = Math.ceil((new Date(book.due_date) - new Date()) / (1000 * 60 * 60 * 24));
    const msg = `"${book.title}" is due ${daysLeft <= 0 ? 'today' : `in ${daysLeft} day(s)`} (${new Date(book.due_date).toLocaleDateString()}).`;
    await createNotification(book.student_id, 'Due Date Reminder', msg, 'due_date');
    await sendEmail(
      book.email,
      'Szabist Library - Due Date Reminder',
      `<p>Hello ${book.name},</p><p>${msg}</p><p>Please return on time to avoid fines.</p>`
    );
  }
};

const initCronJobs = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running daily library tasks...');
    await processOverdueBooks();
    await expireReservations();
    await sendDueDateReminders();
  });

  cron.schedule('0 * * * *', async () => {
    await expireReservations();
  });

  console.log('Cron jobs initialized.');
};

module.exports = { initCronJobs };
