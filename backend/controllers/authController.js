const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendEmail } = require('../utils/email');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// 7d default to match JWT_EXPIRES_IN's default; parses a "7d"/"1h"-style
// duration if it's been overridden, otherwise falls back to 7 days.
const cookieMaxAge = () => {
  const raw = process.env.JWT_EXPIRES_IN || '7d';
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return value * unitMs;
};

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: cookieMaxAge(),
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, department, semester } = req.body;
    if (!name || !email || !password || !department || !semester) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const [existing] = await pool.execute('SELECT student_id FROM Students WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO Students (name, email, password, department, semester) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, department, semester]
    );

    const token = generateToken({
      id: result.insertId,
      email,
      name,
      role: 'student',
    });
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: { id: result.insertId, name, email, role: 'student', department, semester },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email/username and password required.' });
    }

    if (role === 'admin') {
      const [admins] = await pool.execute('SELECT * FROM Admins WHERE username = ?', [email]);
      if (admins.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
      const admin = admins[0];
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
      const token = generateToken({ id: admin.admin_id, username: admin.username, role: 'admin' });
      setAuthCookie(res, token);
      return res.json({
        message: 'Login successful.',
        token,
        user: { id: admin.admin_id, username: admin.username, role: 'admin' },
      });
    }

    const [students] = await pool.execute('SELECT * FROM Students WHERE email = ?', [email]);
    if (students.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const student = students[0];
    if (student.is_blocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Contact the library.' });
    }
    const valid = await bcrypt.compare(password, student.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken({
      id: student.student_id,
      email: student.email,
      name: student.name,
      role: 'student',
    });
    setAuthCookie(res, token);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: student.student_id,
        name: student.name,
        email: student.email,
        role: 'student',
        department: student.department,
        semester: student.semester,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const [students] = await pool.execute('SELECT * FROM Students WHERE email = ?', [email]);
    if (students.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const student = students[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000);

    await pool.execute(
      'UPDATE Students SET reset_token = ?, reset_token_expiry = ? WHERE student_id = ?',
      [token, expiry, student.student_id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail(
      email,
      'Szabist Library - Password Reset',
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1a365d;">Szabist Digital Library</h2>
        <p>Hello ${student.name},</p>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <a href="${resetUrl}" style="background:#d4a853;color:#1a365d;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Reset Password</a>
        <p style="margin-top:20px;color:#666;">If you didn't request this, ignore this email.</p>
      </div>`
    );

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password required.' });
    }

    const [students] = await pool.execute(
      'SELECT * FROM Students WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );
    if (students.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      'UPDATE Students SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE student_id = ?',
      [hashed, students[0].student_id]
    );

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const [admins] = await pool.execute('SELECT admin_id, username FROM Admins WHERE admin_id = ?', [
        req.user.id,
      ]);
      if (admins.length === 0) return res.status(404).json({ message: 'Account not found.' });
      return res.json({ id: admins[0].admin_id, username: admins[0].username, role: 'admin' });
    }
    const [students] = await pool.execute(
      'SELECT student_id, name, email, department, semester, created_at FROM Students WHERE student_id = ?',
      [req.user.id]
    );
    if (students.length === 0) return res.status(404).json({ message: 'Account not found.' });
    res.json({ ...students[0], id: students[0].student_id, role: 'student' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out.' });
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(400).json({ message: 'Only student profiles can be edited here.' });
    }
    const { name, department, semester } = req.body;
    await pool.execute(
      'UPDATE Students SET name = ?, department = ?, semester = ? WHERE student_id = ?',
      [name, department, semester, req.user.id]
    );
    const [students] = await pool.execute(
      'SELECT student_id, name, email, department, semester FROM Students WHERE student_id = ?',
      [req.user.id]
    );
    res.json({ message: 'Profile updated successfully.', user: { ...students[0], id: students[0].student_id, role: 'student' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const table = req.user.role === 'admin' ? 'Admins' : 'Students';
    const idCol = req.user.role === 'admin' ? 'admin_id' : 'student_id';

    const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE ${idCol} = ?`, [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Account not found.' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.execute(`UPDATE ${table} SET password = ? WHERE ${idCol} = ?`, [hashed, req.user.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};
