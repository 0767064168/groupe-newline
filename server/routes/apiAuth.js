const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { pool } = require('../db');

const router = express.Router();

function authToken(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  return h.slice('Bearer '.length).trim();
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const [rows] = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail]
    );
    if (!rows.length) return res.status(401).json({ error: 'invalid_credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ ok: true, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Middleware helper (re-export)
router.requireAuth = (req, res, next) => {
  try {
    const token = authToken(req);
    if (!token) return res.status(401).json({ error: 'missing_token' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
};

module.exports = router;

