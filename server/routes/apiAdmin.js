const express = require('express');
const slugify = require('slugify');

const { pool } = require('../db');
const apiAuth = require('./apiAuth');
const galleryService = require('../services/galleryService');
const { upload, deleteUploadByUrl } = require('../services/storageService');
const { seedGalleryFromAssets, seedGalleryFromLocalMedia } = require('../services/gallerySeedService');

const router = express.Router();

// --- AUTH MIDDLEWARE ---
router.use((req, res, next) => {
  return apiAuth.requireAuth(req, res, next);
});


// --- STATS for dashboard ---
router.get('/stats', async (req, res) => {
  try {
    const [reservationsTotalRows] = await pool.query('SELECT COUNT(*) as total FROM reservations');
    const [attenteRows] = await pool.query("SELECT COUNT(*) as c FROM reservations WHERE statut='En attente'");
    const [confirmeRows] = await pool.query("SELECT COUNT(*) as c FROM reservations WHERE statut='Confirmé'");
    const [termineRows] = await pool.query("SELECT COUNT(*) as c FROM reservations WHERE statut='Terminé'");

    const [messagesTotalRows] = await pool.query('SELECT COUNT(*) as total FROM messages');

    const [notifRows] = await pool.query('SELECT COUNT(*) as c FROM messages WHERE lu = 0');

    res.json({
      ok: true,
      stats: {
        reservations: {
          total: reservationsTotalRows[0].total,
          attente: attenteRows[0].c,
          confirme: confirmeRows[0].c,
          termine: termineRows[0].c
        },
        messages: {
          total: messagesTotalRows[0].total,
          nonLus: notifRows[0].c
        }
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// --- Messages ---
router.get('/messages', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nom, email, sujet, message, lu, created_at, read_at FROM messages ORDER BY created_at DESC'
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.patch('/messages/:id/read', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });

    await pool.query('UPDATE messages SET lu = 1, read_at = NOW() WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.delete('/messages/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });
    await pool.query('DELETE FROM messages WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// --- Reservations ---
router.get('/reservations', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nom, email, tel, date_event as date, type, guests, message, statut, created_at, updated_at FROM reservations ORDER BY id DESC'
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.patch('/reservations/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });

    const { nom, email, tel, type, statut, date, guests, message } = req.body || {};

    if (!nom || !email || !tel || !type || !statut || !date || !guests) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const guestsInt = Number(guests);
    if (!Number.isFinite(guestsInt) || guestsInt < 1) {
      return res.status(400).json({ error: 'invalid_guests' });
    }

    await pool.query(
      `UPDATE reservations
       SET nom=?, email=?, tel=?, type=?, statut=?, date_event=?, guests=?, message=?, updated_at=NOW()
       WHERE id=?`,
      [
        nom.trim(),
        email.trim(),
        tel.trim(),
        type,
        statut,
        date,
        guestsInt,
        message ? String(message).trim() : null,
        id
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.delete('/reservations/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });
    await pool.query('DELETE FROM reservations WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.patch('/reservations/:id/statut', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { statut } = req.body || {};
    if (!id || !statut) return res.status(400).json({ error: 'missing_fields' });
    await pool.query('UPDATE reservations SET statut=?, updated_at=NOW() WHERE id=?', [statut, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// --- Blog admin CRUD ---
router.get('/blog', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, titre, slug, tag, emoji, extrait, date_publication as date, contenu, vues, published FROM blog_posts ORDER BY id DESC'
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/blog', async (req, res) => {
  try {
    const { titre, tag, emoji, date, extrait, contenu } = req.body || {};
    if (!titre || !tag || !date || !extrait) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const baseSlug = slugify(String(titre), { lower: true, strict: true });
    const slug = baseSlug || `post-${Date.now()}`;

    const [result] = await pool.query(
      `INSERT INTO blog_posts (titre, slug, tag, emoji, extrait, date_publication, contenu, vues, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, NOW(), NULL)
       ON DUPLICATE KEY UPDATE titre=VALUES(titre), tag=VALUES(tag), emoji=VALUES(emoji), extrait=VALUES(extrait), date_publication=VALUES(date_publication), contenu=VALUES(contenu)` ,
      [
        String(titre).trim(),
        slug,
        String(tag).trim(),
        emoji ? String(emoji).trim() : null,
        String(extrait).trim(),
        date,
        contenu ? String(contenu) : null
      ]
    );

    res.json({ ok: true, id: result.insertId || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.delete('/blog/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });
    await pool.query('DELETE FROM blog_posts WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// --- Gallery admin CRUD ---
router.get('/galerie', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const cat = req.query.cat || null;
    const items = await galleryService.listGalleryItems({ limit, cat });
    res.json({ ok: true, data: items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/galerie', upload.single('file'), async (req, res) => {
  try {
    const { titre, cat, media_type, url } = req.body || {};
    if (!titre) return res.status(400).json({ error: 'missing_fields' });

    let finalType = media_type || 'image';
    let finalUrl = url || '';

    if (req.file) {
      finalUrl = `/uploads/${req.file.filename}`;
      // type attendu par le frontend: { type } (alias media_type en DB)
      finalType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    if (!finalUrl) {
      return res.status(400).json({ error: 'missing_url_or_file' });
    }

    const item = await galleryService.createGalleryItem({
      titre,
      cat,
      type: finalType,
      url: finalUrl
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('gallery:updated', { action: 'created', id: item.id });
    }

    res.json({ ok: true, id: item.id });
  } catch (e) {
    console.error(e);
    if (e.message === 'invalid_file_type') {
      return res.status(400).json({ error: 'invalid_file_type' });
    }
    res.status(500).json({ error: 'server_error' });
  }
});

router.patch('/galerie/:id', upload.single('file'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });

    const { titre, cat, media_type, url } = req.body || {};
    const updates = {};

    if (titre !== undefined) updates.titre = titre;
    if (cat !== undefined) updates.cat = cat;
    if (media_type !== undefined) updates.type = media_type;
    if (url !== undefined) updates.url = url;

    if (req.file) {
      const item = await galleryService.getGalleryItem(id);
      if (!item) return res.status(404).json({ error: 'not_found' });
      if (item.url && item.url.startsWith('/uploads/')) {
        deleteUploadByUrl(item.url);
      }
      updates.url = `/uploads/${req.file.filename}`;
      updates.type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const updatedItem = await galleryService.updateGalleryItem(id, updates);
    if (!updatedItem) return res.status(404).json({ error: 'not_found' });

    const io = req.app.get('io');
    if (io) {
      io.emit('gallery:updated', { action: 'updated', id });
    }

    res.json({ ok: true, data: updatedItem });
  } catch (e) {
    console.error(e);
    if (e.message === 'invalid_file_type') {
      return res.status(400).json({ error: 'invalid_file_type' });
    }
    res.status(500).json({ error: 'server_error' });
  }
});

router.delete('/galerie/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid_id' });

    const url = await galleryService.deleteGalleryItem(id);
    if (url && url.startsWith('/uploads/')) {
      deleteUploadByUrl(url);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('gallery:updated', { action: 'deleted', id });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Seed gallery from assets/images/gallery1..3.png (fix missing DB rows)
router.post('/galerie/seed-assets', async (req, res) => {
  try {
    const { overwrite } = req.body || {};

    const result = await seedGalleryFromAssets({
      pool,
      overwrite: Boolean(overwrite),
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('gallery:updated', { action: 'seeded' });
    }

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/galerie/seed', async (req, res) => {
  try {
    const { source = 'all', overwrite } = req.body || {};
    const normalizedSource = Array.isArray(source)
      ? source
      : String(source || 'all');

    const result = await seedGalleryFromLocalMedia({
      pool,
      overwrite: Boolean(overwrite),
      sources: normalizedSource,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('gallery:updated', { action: 'seeded' });
    }

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;


