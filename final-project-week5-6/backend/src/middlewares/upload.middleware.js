const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const generateSafeFilename = (file) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, generateSafeFilename(file)),
});

const fileFilter = (req, file, cb) => {
  const isAllowedMime = allowedMimeTypes.has(file.mimetype);
  const isAllowedExtension = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(
    path.extname(file.originalname || "").toLowerCase(),
  );

  if (isAllowedMime && isAllowedExtension) {
    cb(null, true);
    return;
  }

  cb(new Error("Only safe image files (.jpg, .jpeg, .png, .webp, .gif, .svg) are allowed."), false);
};

exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
