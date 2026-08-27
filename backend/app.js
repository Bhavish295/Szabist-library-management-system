const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

app.use(
  helmet({
    // Cover images / PDFs are served cross-origin to the Vite dev server;
    // the default CORP policy would block that in the browser.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Szabist Library API is running' });
});

app.use('/api', apiLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/fines', require('./routes/fines'));
app.use('/api/students', require('./routes/students'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));

app.use((req, res) => {
  res.status(404).json({ message: 'Not found.' });
});

// Centralized error handler. Never leak stack traces / internals to the
// client — log them server-side and return a generic message instead.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Internal server error.' : err.message,
  });
});

module.exports = app;
