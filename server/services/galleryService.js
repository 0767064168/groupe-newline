const { pool } = require('../db');

async function listGalleryItems({ limit = 50, cat = null } = {}) {
  const params = [];
  let where = '';
  if (cat && cat !== 'all') {
    where = 'WHERE cat = ?';
    params.push(cat);
  }
  const [rows] = await pool.query(
    `SELECT id, titre, cat, media_type AS type, url, created_at, sort_order
     FROM media_gallery
     ${where}
     ORDER BY sort_order DESC, id DESC
     LIMIT ?`,
    [...params, Number(limit)]
  );
  return rows;
}

async function getGalleryItem(id) {
  const [rows] = await pool.query(
    'SELECT id, titre, cat, media_type AS type, url, created_at FROM media_gallery WHERE id = ? LIMIT 1',
    [Number(id)]
  );
  return rows[0] || null;
}

async function createGalleryItem({ titre, cat, type, url }) {
  const [result] = await pool.query(
    `INSERT INTO media_gallery (titre, cat, media_type, url, sort_order, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [String(titre).trim(), cat ? String(cat).trim() : null, String(type).trim(), String(url).trim()]
  );
  return { id: result.insertId };
}

async function updateGalleryItem(id, { titre, cat, type, url }) {
  const updates = [];
  const params = [];

  if (titre !== undefined) {
    updates.push('titre = ?');
    params.push(String(titre).trim());
  }
  if (cat !== undefined) {
    updates.push('cat = ?');
    params.push(cat ? String(cat).trim() : null);
  }
  if (type !== undefined) {
    updates.push('media_type = ?');
    params.push(String(type).trim());
  }
  if (url !== undefined) {
    updates.push('url = ?');
    params.push(String(url).trim());
  }

  if (!updates.length) {
    return null;
  }

  params.push(Number(id));
  await pool.query(
    `UPDATE media_gallery SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  return await getGalleryItem(id);
}

async function deleteGalleryItem(id) {
  const item = await getGalleryItem(id);
  if (!item) return null;
  await pool.query('DELETE FROM media_gallery WHERE id = ?', [Number(id)]);
  return item.url;
}

module.exports = {
  listGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
};
