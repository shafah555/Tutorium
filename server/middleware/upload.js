const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error('Only image files (jpg, png, webp) are allowed'), ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_UPLOAD_MB, 10) || 5) * 1024 * 1024 },
});

// Used for small branding assets (settings logo/signature) that we base64-encode
// straight into the database instead of writing to disk. Disk uploads (e.g.
// student photos) don't survive a redeploy on hosts with an ephemeral
// filesystem (Render free tier, etc.), which is why these are kept separate
// from the disk-backed `upload` above and capped at a smaller size so the
// database rows stay reasonable.
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB per image
});

module.exports = upload;
module.exports.uploadMemory = uploadMemory;