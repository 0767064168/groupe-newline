const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({


  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initAdminIfNeeded() {
  const [rows] = await pool.query('SELECT COUNT(*) as c FROM users');
  if (rows[0].c > 0) return;

  const bcrypt = require('bcryptjs');
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('No ADMIN_EMAIL/ADMIN_PASSWORD configured; skipping admin insert.');
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, NOW())',
    [normalizedEmail, hash]
  );
}

module.exports = { pool, initAdminIfNeeded };

