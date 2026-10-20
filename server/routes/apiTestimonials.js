const express = require('express');
const apiAuth = require('./apiAuth');

const { pool } = require('../db');

const router = express.Router();

// Public: list only published
router.get('/testimonials', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nom, role, note, message, published, created_at, updated_at FROM testimonials WHERE published = 1 ORDER BY id DESC'
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Admin routes
router.use((req, res, next) => apiAuth.requireAuth(req, res, next));

router.get('/admin/testimonials', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nom, role, note, message, published, created_at, updated_at FROM testimonials ORDER BY id DESC'
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.patch('/admin/testimonials/:id/publish', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });
    await pool.query('UPDATE testimonials SET published = 1, updated_at = NOW() WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) io.emit('testimonials:updated', { action: 'publish', id });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.patch('/admin/testimonials/:id/unpublish', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });
    await pool.query('UPDATE testimonials SET published = 0, updated_at = NOW() WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) io.emit('testimonials:updated', { action: 'unpublish', id });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.delete('/admin/testimonials/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });
    await pool.query('DELETE FROM testimonials WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) io.emit('testimonials:updated', { action: 'delete', id });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Optional: admin can create a testimonial directly (not required for your case)
router.post('/admin/testimonials', async (req, res) => {
  try {
    const { nom, role, note, message, published } = req.body || {};
    if (!nom || !message) return res.status(400).json({ error: 'missing_fields' });

    const n = Number(note);
    const noteInt = Number.isFinite(n) ? n : 5;
    const pub = published === 1 || published === true ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO testimonials (nom, role, note, message, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NULL)`,
      [String(nom).trim(), role ? String(role).trim() : null, noteInt, String(message).trim(), pub]
    );

    const io = req.app.get('io');
    if (io) io.emit('testimonials:updated', { action: 'created', id: result.insertId });

    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;

