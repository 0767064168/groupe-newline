const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets', 'images');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const DEFAULT_ASSETS_SEED = [
  { file: 'gallery1.png', titre: 'Mariage élégant – Cocody', cat: 'Mariage' },
  { file: 'gallery2.png', titre: 'Conférence internationale', cat: 'Corporate' },
  { file: 'gallery3.png', titre: 'Gala de prestige', cat: 'Gala' },
];

const MEDIA_EXTENSION_MAP = {
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.mp4': 'video',
  '.mov': 'video',
  '.avi': 'video',
  '.mkv': 'video',
  '.webm': 'video',
};

function getMediaType(fileName) {
  const ext = path.extname(fileName || '').toLowerCase();
  return MEDIA_EXTENSION_MAP[ext] || 'image';
}

function ensureExists(filePath) {
  return fs.existsSync(filePath);
}

function buildAssetItem(item) {
  return {
    source: 'assets',
    file: item.file,
    titre: item.titre,
    cat: item.cat || null,
    media_type: 'image',
    url: `/assets/images/${item.file}`,
    diskPath: path.join(ASSETS_DIR, item.file),
  };
}

function buildUploadItem(fileName) {
  return {
    source: 'uploads',
    file: fileName,
    titre: path.basename(fileName, path.extname(fileName)).replace(/[-_]+/g, ' '),
    cat: null,
    media_type: getMediaType(fileName),
    url: `/uploads/${fileName}`,
    diskPath: path.join(UPLOADS_DIR, fileName),
  };
}

function listUploadFiles() {
  if (!ensureExists(UPLOADS_DIR)) {
    return [];
  }

  return fs.readdirSync(UPLOADS_DIR)
    .filter((item) => {
      const ext = path.extname(item).toLowerCase();
      return Object.prototype.hasOwnProperty.call(MEDIA_EXTENSION_MAP, ext);
    })
    .sort();
}

async function seedGalleryItems({ pool, items = [], overwrite = false }) {
  if (!pool) throw new Error('pool_required');

  const results = [];
  for (const item of items) {
    if (!item || !item.url || !item.diskPath || !item.file) {
      results.push({ file: item?.file || null, inserted: false, reason: 'invalid_item' });
      continue;
    }

    if (!ensureExists(item.diskPath)) {
      results.push({ file: item.file, inserted: false, reason: 'missing_on_disk' });
      continue;
    }

    if (overwrite) {
      await pool.query('DELETE FROM media_gallery WHERE url = ?', [item.url]);
    } else {
      const [rows] = await pool.query('SELECT id FROM media_gallery WHERE url = ? LIMIT 1', [item.url]);
      if (rows.length) {
        results.push({ file: item.file, inserted: false, reason: 'already_exists' });
        continue;
      }
    }

    await pool.query(
      `INSERT INTO media_gallery (titre, cat, media_type, url, sort_order, created_at)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [item.titre || '', item.cat, item.media_type, item.url]
    );

    results.push({ file: item.file, inserted: true, overwritten: overwrite });
  }

  return { ok: true, results };
}

async function seedGalleryFromAssets({ pool, items = DEFAULT_ASSETS_SEED, overwrite = false }) {
  const seedItems = items.map(buildAssetItem);
  return seedGalleryItems({ pool, items: seedItems, overwrite });
}

async function seedGalleryFromUploads({ pool, overwrite = false, files = null }) {
  const uploadFiles = Array.isArray(files) ? files : listUploadFiles();
  const seedItems = uploadFiles.map(buildUploadItem);
  return seedGalleryItems({ pool, items: seedItems, overwrite });
}

async function seedGalleryFromLocalMedia({ pool, overwrite = false, sources = ['assets', 'uploads'] }) {
  if (!pool) throw new Error('pool_required');

  const results = [];
  const normalizedSources = Array.isArray(sources)
    ? sources.map((source) => String(source).trim().toLowerCase()).filter(Boolean)
    : [String(sources).trim().toLowerCase()];

  if (normalizedSources.includes('all') || normalizedSources.includes('assets')) {
    const assetsResult = await seedGalleryFromAssets({ pool, overwrite });
    results.push({ source: 'assets', ...assetsResult });
  }

  if (normalizedSources.includes('all') || normalizedSources.includes('uploads')) {
    const uploadsResult = await seedGalleryFromUploads({ pool, overwrite });
    results.push({ source: 'uploads', ...uploadsResult });
  }

  return { ok: true, results };
}

module.exports = {
  seedGalleryFromAssets,
  seedGalleryFromUploads,
  seedGalleryFromLocalMedia,
};

