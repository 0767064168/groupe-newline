require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
    });

    const [rows] = await pool.query('SELECT id, email, created_at FROM users ORDER BY id DESC LIMIT 10');
    console.log('users:');
    rows.forEach(r => console.log(' -', r.id, r.email, r.created_at));
    await pool.end();
  } catch (e) {
    console.error('error:', e.message);
    process.exit(1);
  }
})();
