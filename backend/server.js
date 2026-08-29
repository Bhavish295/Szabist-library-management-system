require('dotenv').config();

const app = require('./app');
const { initCronJobs } = require('./cron/jobs');

const PORT = process.env.PORT || 5000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Szabist Library Server running on http://127.0.0.1:${PORT}`);
  initCronJobs();
});
