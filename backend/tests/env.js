// Runs in each Jest worker before test files are loaded, so app.js sees
// the test environment (separate DB, throwaway JWT secret) rather than
// whatever's in the developer's real .env.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.test') });
