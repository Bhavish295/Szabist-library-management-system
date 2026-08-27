const request = require('supertest');
const app = require('../app');

let counter = 0;
// Unique-enough per test run so parallel `it` blocks in the same file
// don't collide on the Students.email UNIQUE constraint.
const uniqueEmail = (label) => `${label}.${Date.now()}.${counter++}@szabist.edu.pk`;

// isbn is VARCHAR(20) — a plain Date.now()+Math.random() string blows past
// that, so keep it short via base36.
const uniqueIsbn = () => `T${Date.now().toString(36)}${(counter++).toString(36)}`;

const registerStudent = async (overrides = {}) => {
  const email = overrides.email || uniqueEmail('student');
  const payload = {
    name: 'Test Student',
    email,
    password: 'password123',
    department: 'Computer Science',
    semester: 3,
    ...overrides,
    email,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { res, token: res.body.token, email };
};

const loginAdmin = async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin', password: 'admin123', role: 'admin' });
  return res.body.token;
};

module.exports = { app, request, registerStudent, loginAdmin, uniqueEmail, uniqueIsbn };
