import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads'));

if (env.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

/** Checks the file's magic bytes so a renamed non-image can't slip through the mimetype check. */
function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buffer.toString('ascii', 4, 12) === 'ftypavif') return 'avif';
  return null;
}

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `${env.cloudinary.folder}/${folder}`, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

/**
 * Stores an uploaded image (multer memory file) in Cloudinary when configured,
 * otherwise on local disk under /uploads/<folder>.
 * @returns {Promise<{url: string, publicId: string, alt: string}>}
 */
export async function saveImage(file, folder = 'misc', alt = '') {
  const ext = detectImageType(file.buffer);
  if (!ext) throw ApiError.badRequest(`"${file.originalname}" is not a valid image file`);

  if (env.cloudinary.enabled) {
    const result = await uploadToCloudinary(file.buffer, folder);
    return { url: result.secure_url, publicId: result.public_id, alt };
  }

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, '');
  const dir = path.join(UPLOAD_ROOT, safeFolder);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(dir, filename), file.buffer);
  return {
    url: `${env.apiUrl}/uploads/${safeFolder}/${filename}`,
    publicId: `local:${safeFolder}/${filename}`,
    alt,
  };
}

export const saveImages = (files = [], folder, alt = '') =>
  Promise.all(files.map((f) => saveImage(f, folder, alt)));

export async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    if (publicId.startsWith('local:')) {
      const target = path.resolve(UPLOAD_ROOT, publicId.slice(6));
      if (!target.startsWith(UPLOAD_ROOT)) return; // path traversal guard
      await fs.unlink(target);
    } else if (env.cloudinary.enabled) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('[storage] failed to delete image', publicId, err.message);
  }
}

export const deleteImages = (images = []) => Promise.all(images.map((img) => deleteImage(img?.publicId)));
