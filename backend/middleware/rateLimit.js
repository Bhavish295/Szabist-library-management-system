const rateLimit = require('express-rate-limit');

// Tight limiter for credential-guessing-prone endpoints (login, register,
// forgot-password). Keyed by IP; returns a clean JSON body instead of the
// default plaintext response.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

// Looser general limiter for the rest of the API, mostly a backstop
// against runaway clients/scripts.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

module.exports = { authLimiter, apiLimiter };
