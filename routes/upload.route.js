import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyToken } from '../utils/verifyUser.js';
import { errorHandler } from '../utils/error.js';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const uniqueName = `${Date.now()}-${cleanBase}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.mp4', '.webm', '.mov'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(errorHandler(400, `Unsupported file format ${ext}. Allowed: images (jpg, png, webp) and videos (mp4, webm)`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max for videos/images
  },
});

// POST /api/upload - Single File Upload (Image or Video)
router.post('/', verifyToken, upload.single('media'), (req, res, next) => {
  try {
    if (!req.file) {
      return next(errorHandler(400, 'Please select an image or video to upload.'));
    }

    const ext = path.extname(req.file.filename).toLowerCase();
    const isVideo = ['.mp4', '.webm', '.mov'].includes(ext);
    const mediaUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      url: mediaUrl,
      type: isVideo ? 'video' : 'image',
      filename: req.file.filename,
      sizeBytes: req.file.size,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/upload/multiple - Multiple photos for community gallery
router.post('/multiple', verifyToken, upload.array('photos', 5), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(errorHandler(400, 'Please select at least one photo.'));
    }

    const urls = req.files.map((file) => `/uploads/${file.filename}`);
    res.status(200).json({
      success: true,
      urls,
      count: urls.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
