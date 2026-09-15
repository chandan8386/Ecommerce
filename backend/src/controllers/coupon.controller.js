import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { buildSummary } from '../services/pricing.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, paginationMeta, parsePagination } from '../utils/helpers.js';

/** POST /coupons/apply — validates a coupon against the user's current cart */
export const applyCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name slug sku price compareAtPrice stock images isActive material'
  );
  if (!cart?.items.length) throw ApiError.badRequest('Your cart is empty');
  const summary = await buildSummary(cart.items, { couponCode: req.body.code, userId: req.user._id });
  if (summary.couponError) throw ApiError.badRequest(summary.couponError);
  res.json({ success: true, data: summary });
});

/** GET /coupons/available — public list of active coupons for display */
export const availableCoupons = asyncHandler(async (_req, res) => {
  const now = new Date();
  const data = await Coupon.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
    ],
  })
    .select('code description discountType discountValue minOrderAmount maxDiscountAmount expiresAt')
    .sort({ minOrderAmount: 1 })
    .limit(10)
    .lean();
  res.json({ success: true, data });
});

/* ---------- Admin ---------- */
export const listCoupons = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = req.query.q ? { code: new RegExp(escapeRegex(req.query.q), 'i') } : {};
  const [data, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(page, limit, total) });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, data: coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  res.json({ success: true, data: coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  res.json({ success: true, message: 'Coupon deleted' });
});
