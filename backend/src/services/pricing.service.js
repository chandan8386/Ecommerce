import { env } from '../config/env.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { round2 } from '../utils/helpers.js';

/**
 * Validates a coupon for a user and subtotal. Throws ApiError when not applicable.
 */
export async function validateCoupon(code, subtotal, userId) {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon || !coupon.isActive) throw ApiError.badRequest('Invalid coupon code');

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw ApiError.badRequest('This coupon is not active yet');
  if (coupon.expiresAt && coupon.expiresAt < now) throw ApiError.badRequest('This coupon has expired');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }
  if (subtotal < coupon.minOrderAmount) {
    throw ApiError.badRequest(`Add items worth ₹${round2(coupon.minOrderAmount - subtotal)} more to use this coupon`);
  }
  if (userId && coupon.perUserLimit > 0) {
    const used = await Order.countDocuments({
      user: userId,
      'coupon.code': coupon.code,
      status: { $nin: ['cancelled'] },
    });
    if (used >= coupon.perUserLimit) throw ApiError.badRequest('You have already used this coupon');
  }
  return coupon;
}

/**
 * Builds a priced cart summary from cart items whose `product` is populated.
 * Prices always come from the database, never from the client.
 */
export async function buildSummary(items, { couponCode, userId } = {}) {
  const lines = [];
  const issues = [];

  for (const item of items) {
    const p = item.product;
    if (!p || !p.isActive) {
      issues.push({ itemId: item._id, message: 'A product in your cart is no longer available' });
      continue;
    }
    const quantity = item.quantity;
    if (p.stock < quantity) {
      issues.push({
        itemId: item._id,
        productId: p._id,
        message: p.stock === 0 ? `${p.name} is out of stock` : `Only ${p.stock} of ${p.name} left in stock`,
      });
    }
    lines.push({
      _id: item._id,
      product: {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        material: p.material,
        image: p.images?.[0]?.url || '',
      },
      quantity,
      size: item.size || '',
      color: item.color || '',
      lineTotal: round2(p.price * quantity),
    });
  }

  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  let discount = 0;
  let coupon = null;
  let couponError = null;

  if (couponCode && subtotal > 0) {
    try {
      const c = await validateCoupon(couponCode, subtotal, userId);
      discount = c.computeDiscount(subtotal);
      coupon = { code: c.code, description: c.description, discount };
    } catch (err) {
      couponError = err.message;
    }
  }

  const { taxRate, shippingFee, freeShippingThreshold, currency } = env.commerce;
  const taxable = Math.max(0, subtotal - discount);
  const shipping = subtotal === 0 || taxable >= freeShippingThreshold ? 0 : shippingFee;
  const tax = round2((taxable * taxRate) / 100);
  const total = round2(taxable + shipping + tax);

  return {
    items: lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    pricing: { subtotal, discount, shipping, tax, total, currency, taxRate, freeShippingThreshold },
    coupon,
    couponError,
    issues,
  };
}
