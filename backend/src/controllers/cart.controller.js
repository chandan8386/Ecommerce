import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { buildSummary } from '../services/pricing.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const MAX_QTY = 20;

const loadCart = async (userId) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, new: true }
  );
  return cart;
};

const respond = async (res, userId, couponCode, status = 200) => {
  const cart = await Cart.findOne({ user: userId }).populate(
    'items.product',
    'name slug sku price compareAtPrice stock images isActive material'
  );
  const summary = await buildSummary(cart?.items || [], { couponCode, userId });
  res.status(status).json({ success: true, data: summary });
};

const matchOption = (options, value, label) => {
  if (!options?.length) return '';
  if (!value) throw ApiError.badRequest(`Please select a ${label}`);
  const match = options.find((o) => o.toLowerCase() === value.toLowerCase());
  if (!match) throw ApiError.badRequest(`Invalid ${label} "${value}"`);
  return match;
};

async function addLine(cart, { productId, quantity, size, color }, { strict = true } = {}) {
  const product = await Product.findOne({ _id: productId, isActive: true }).select('stock sizes colors name');
  if (!product) {
    if (strict) throw ApiError.notFound('Product not available');
    return;
  }
  let chosenSize;
  let chosenColor;
  try {
    chosenSize = matchOption(product.sizes, size, 'size');
    chosenColor = matchOption(product.colors, color, 'color');
  } catch (err) {
    if (strict) throw err;
    chosenSize = product.sizes?.[0] || '';
    chosenColor = product.colors?.[0] || '';
  }

  const existing = cart.items.find(
    (i) => i.product.equals(product._id) && i.size === chosenSize && i.color === chosenColor
  );
  const desired = (existing?.quantity || 0) + quantity;
  const allowed = Math.min(desired, product.stock, MAX_QTY);

  if (product.stock === 0) {
    if (strict) throw ApiError.badRequest(`${product.name} is out of stock`);
    return;
  }
  if (strict && desired > product.stock) {
    throw ApiError.badRequest(`Only ${product.stock} of ${product.name} available`);
  }
  if (existing) existing.quantity = allowed;
  else cart.items.push({ product: product._id, quantity: allowed, size: chosenSize, color: chosenColor });
}

export const getCart = asyncHandler(async (req, res) => {
  await respond(res, req.user._id, req.query.coupon);
});

export const addItem = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.user._id);
  await addLine(cart, req.body);
  await cart.save();
  await respond(res, req.user._id, req.query.coupon, 201);
});

export const updateItem = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');
  const product = await Product.findById(item.product).select('stock name');
  if (product && req.body.quantity > product.stock) {
    throw ApiError.badRequest(`Only ${product.stock} of ${product.name} available`);
  }
  item.quantity = req.body.quantity;
  await cart.save();
  await respond(res, req.user._id, req.query.coupon);
});

export const removeItem = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $pull: { items: { _id: req.params.itemId } } });
  await respond(res, req.user._id, req.query.coupon);
});

export const clearCart = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  await respond(res, req.user._id);
});

/** POST /cart/merge — merges a guest (localStorage) cart after login. Invalid lines are skipped. */
export const mergeCart = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.user._id);
  for (const line of req.body.items) {
    await addLine(cart, line, { strict: false });
  }
  await cart.save();
  await respond(res, req.user._id);
});
