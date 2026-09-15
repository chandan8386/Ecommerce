import { Banner } from '../models/Banner.js';
import { deleteImage, saveImage } from '../services/storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** GET /banners?position=hero (public, active & within schedule) */
export const listActiveBanners = asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };
  if (['hero', 'promo'].includes(req.query.position)) filter.position = req.query.position;
  const data = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json({ success: true, data });
});

export const adminListBanners = asyncHandler(async (_req, res) => {
  const data = await Banner.find().sort({ position: 1, sortOrder: 1 }).lean();
  res.json({ success: true, data });
});

export const createBanner = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Banner image is required');
  const image = await saveImage(req.file, 'banners', req.body.title);
  try {
    const banner = await Banner.create({ ...req.body, image });
    res.status(201).json({ success: true, data: banner });
  } catch (err) {
    await deleteImage(image.publicId);
    throw err;
  }
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw ApiError.notFound('Banner not found');
  const oldImage = banner.image;
  banner.set(req.body);
  if (req.file) banner.image = await saveImage(req.file, 'banners', banner.title);
  await banner.save();
  if (req.file && oldImage?.publicId) await deleteImage(oldImage.publicId);
  res.json({ success: true, data: banner });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw ApiError.notFound('Banner not found');
  await deleteImage(banner.image?.publicId);
  res.json({ success: true, message: 'Banner deleted' });
});
