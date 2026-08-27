require('dotenv').config();

const app = require('./app');
const { initCronJobs } = require('./cron/jobs');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Szabist Library Server running on port ${PORT}`);
  initCronJobs();
});
