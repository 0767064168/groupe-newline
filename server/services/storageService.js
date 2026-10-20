const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/ogg'
];

function safeFilename(filename) {
  const name = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const timestamp = Date.now();
  const ext = path.extname(name) || '';
  return `${timestamp}-${path.basename(name, ext)}${ext}`;
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    cb(null, safeFilename(file.originalname));
  }
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('invalid_file_type'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

function deleteUploadByUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('/uploads/')) return false;

  const safePath = path.join(UPLOAD_DIR, path.basename(url.split('?')[0]));
  if (!safePath.startsWith(UPLOAD_DIR)) return false;

  try {
    if (fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('deleteUploadByUrl error:', error);
    return false;
  }
}

module.exports = {
  upload,
  deleteUploadByUrl
};
