const express = require('express');
const router = express.Router();

const { pool } = require('../db');

// Create reservation
router.post('/reservations', async (req, res) => {
  try {
    const {
      nom,
      email,
      tel,
      date,
      type,
      guests,
      message
    } = req.body || {};

    if (!nom || !email || !tel || !date || !type || !guests) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const guestsInt = Number(guests);
    if (!Number.isFinite(guestsInt) || guestsInt < 1) {
      return res.status(400).json({ error: 'invalid_guests' });
    }

    const [result] = await pool.query(
      `INSERT INTO reservations
        (nom, email, tel, date_event, type, guests, message, statut, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'En attente', NOW(), NULL)`,
      [nom.trim(), email.trim(), tel.trim(), date, type, guestsInt, message || null]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Create contact message
router.post('/messages', async (req, res) => {
  try {
    const { nom, email, sujet, message } = req.body || {};
    if (!nom || !email || !message) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const [result] = await pool.query(
      `INSERT INTO messages (nom, email, sujet, message, lu, created_at, read_at)
       VALUES (?, ?, ?, ?, 0, NOW(), NULL)`,
      [nom.trim(), email.trim(), sujet ? sujet.trim() : null, message.trim()]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Blog list
router.get('/blog', async (req, res) => {
  try {
    const tag = req.query.tag || null;
    const q = (req.query.q || '').toString().trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const perPage = Math.min(30, Math.max(1, Number(req.query.perPage || 9)));

    const offset = (page - 1) * perPage;

    let where = 'WHERE published = 1';
    const params = [];

    if (tag && tag !== 'all') {
      where += ' AND tag = ?';
      params.push(tag);
    }

    if (q) {
      where += ' AND (titre LIKE ? OR extrait LIKE ? OR tag LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    const [rows] = await pool.query(
      `SELECT id, titre, slug, tag, emoji, extrait, date_publication AS date, vues
       FROM blog_posts
       ${where}
       ORDER BY date_publication DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as c FROM blog_posts ${where}`,
      params
    );

    res.json({
      ok: true,
      data: rows,
      page,
      perPage,
      total: countRows[0].c
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Blog single + increment views
router.get('/blog/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });

    const [rows] = await pool.query('SELECT * FROM blog_posts WHERE id = ? AND published = 1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'not_found' });

    await pool.query('UPDATE blog_posts SET vues = vues + 1 WHERE id = ?', [id]);

    const post = rows[0];
    post.date = post.date_publication;
    delete post.date_publication;

    res.json({ ok: true, data: post });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Gallery list
router.get('/galerie', async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const cat = req.query.cat || null;

    let where = '';
    const params = [];
    if (cat && cat !== 'all') {
      where = 'WHERE cat = ?';
      params.push(cat);
    }

    const [rows] = await pool.query(
      `SELECT id, titre, cat, media_type AS type, url
       FROM media_gallery
       ${where}
       ORDER BY sort_order DESC, id DESC
       LIMIT ?`,
      [...params, limit]
    );

    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;

