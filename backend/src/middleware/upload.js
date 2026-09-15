import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_IMAGES = 10;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: MAX_IMAGES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type "${file.mimetype}". Use JPG, PNG, WEBP or AVIF.`));
    }
    cb(null, true);
  },
});

export const uploadImages = (field = 'images', max = MAX_IMAGES) => upload.array(field, max);
export const uploadSingle = (field = 'image') => upload.single(field);
