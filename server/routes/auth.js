const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ── REGISTER ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ message: 'Invalid email address.' });

  if (password.length < 8)
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  try {
    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const password_hash = await bcrypt.hash(password, 12); // 12 rounds for production

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase().trim(), password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];

    // Always run bcrypt compare even if user not found — prevents timing attacks
    const dummyHash = '$2a$12$dummyhashtopreventtimingattackspadding1234567890abcdef';
    const isValid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !isValid)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed.' });
  }
});

// ── LOGOUT ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully.' });
});

// ── GET CURRENT USER ──────────────────────────────────────────
router.get('/me', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [decoded.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found.' });

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired session.' });
  }
});

module.exports = router;