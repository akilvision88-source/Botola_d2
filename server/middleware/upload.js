/* =========================================================
   BOTOLA D2 — middleware/upload.js
   Multer configuration for image uploads.
   Supports: avatar, logo, thumbnail, image, card_background_file.
   ========================================================= */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

/* =========================================================
   Ensure a directory exists
   ========================================================= */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/* =========================================================
   Storage — destination based on fieldname
   ========================================================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = 'misc';

    switch (file.fieldname) {
      case 'avatar':
        sub = 'avatars';
        break;
      case 'logo':
        sub = 'teams';
        break;
      case 'thumbnail':
        sub = 'thumbnails';
        break;
      case 'image':
        sub = 'stadiums';
        break;
      case 'card_background_file':   // ✅ NEW
        sub = 'thumbnails';
        break;
      default:
        sub = 'misc';
    }

    const dir = path.join(env.UPLOAD.path, sub);
    ensureDir(dir);
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  }
});

/* =========================================================
   File filter — images only
   ========================================================= */
const fileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|gif|webp|svg/;
  const allowedMime = /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/;

  const extOk = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedMime.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
  }
};

/* =========================================================
   Multer instance
   ========================================================= */
const upload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD.maxFileSize || (5 * 1024 * 1024) // 5MB
  },
  fileFilter
});

module.exports = upload;