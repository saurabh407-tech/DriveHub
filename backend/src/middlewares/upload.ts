import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf'];

const storage = multer.memoryStorage();

export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB per file, up to 10 files
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Only JPEG, PNG, or WebP images are allowed'));
    }
    cb(null, true);
  },
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 }, // 8MB, single file
  fileFilter: (_req, file, cb) => {
    if (!DOCUMENT_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Only JPEG, PNG, WebP, or PDF documents are allowed'));
    }
    cb(null, true);
  },
});
