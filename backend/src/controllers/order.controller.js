import { env } from '../config/env.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { pendingOrderExpiry, releaseOrderStock, reserveStock } from '../services/inventory.service.js';
import {
  changeOrderStatus,
  CUSTOMER_CANCELLABLE,
  findOrderForUser,
} from '../services/order.service.js';
import { createGatewayOrder, paymentConfig } from '../services/payment.service.js';
import { buildSummary } from '../services/pricing.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, generateOrderNumber, paginationMeta, parsePagination, pick } from '../utils/helpers.js';

const ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'];

export const paymentPayload = (order, user, gatewayOrder) => ({
  ...paymentConfig(),
  razorpayOrderId: gatewayOrder.id,
  amount: gatewayOrder.amount,
  orderId: order._id,
  orderNumber: order.orderNumber,
  prefill: { name: user.name, email: user.email, contact: order.shippingAddress.phone },
});

/** POST /orders — creates an order from the user's cart */
export const createOrder = asyncHandler(async (req, res) => {
  const { addressId, shippingAddress, paymentMethod, couponCode, customerNote } = req.body;
  const user = req.user;

  let address = shippingAddress;
  if (addressId) {
    const saved = user.addresses.id(addressId);
    if (!saved) throw ApiError.badRequest('Selected address was not found');
    address = pick(saved.toObject(), ADDRESS_FIELDS);
  }

  const cart = await Cart.findOne({ user: user._id }).populate(
    'items.product',
    'name slug sku price compareAtPrice stock images isActive material'
  );
  if (!cart?.items.length) throw ApiError.badRequest('Your cart is empty');

  const summary = await buildSummary(cart.items, { couponCode, userId: user._id });
  if (couponCode && summary.couponError) throw ApiError.badRequest(summary.couponError);
  if (summary.issues.length) {
    throw new ApiError(409, 'Some items in your cart need attention', summary.issues);
  }

  const items = summary.items.map((l) => ({
    product: l.product._id,
    name: l.product.name,
    slug: l.product.slug,
    sku: l.product.sku,
    image: l.product.image,
    price: l.product.price,
    quantity: l.quantity,
    size: l.size,
    color: l.color,
    lineTotal: l.lineTotal,
  }));

  // 1. Reserve stock atomically
  await reserveStock(items);

  let couponClaimed = false;
  let order;
  try {
    // 2. Claim a coupon use atomically (respecting the global usage limit)
    if (summary.coupon) {
      const claim = await Coupon.updateOne(
        {
          code: summary.coupon.code,
          $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
        },
        { $inc: { usedCount: 1 } }
      );
      if (claim.modifiedCount !== 1) throw ApiError.badRequest('This coupon has reached its usage limit');
      couponClaimed = true;
    }

    // 3. Create the order
    const isCod = paymentMethod === 'cod';
    order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: user._id,
      email: user.email,
      items,
      shippingAddress: address,
      pricing: pick(summary.pricing, ['subtotal', 'discount', 'shipping', 'tax', 'total', 'currency']),
      coupon: summary.coupon ? { code: summary.coupon.code, discount: summary.coupon.discount } : undefined,
      payment: { method: paymentMethod, status: 'pending' },
      status: isCod ? 'confirmed' : 'pending',
      statusHistory: [
        { status: 'pending', note: 'Order placed' },
        ...(isCod ? [{ status: 'confirmed', note: 'Cash on delivery order confirmed' }] : []),
      ],
      customerNote: customerNote || '',
      expiresAt: isCod ? null : pendingOrderExpiry(),
    });

    // 4. Create the gateway order for online payment
    let payment = null;
    if (!isCod) {
      const gatewayOrder = await createGatewayOrder(order);
      order.payment.razorpayOrderId = gatewayOrder.id;
      await order.save();
      payment = paymentPayload(order, user, gatewayOrder);
    }

    // 5. Clear cart and remember the address if it was new
    await Cart.updateOne({ user: user._id }, { $set: { items: [] } });
    if (!addressId && req.body.saveAddress && user.addresses.length < 10) {
      const exists = user.addresses.some((a) => a.line1 === address.line1 && a.postalCode === address.postalCode);
      if (!exists) {
        await User.updateOne(
          { _id: user._id },
          { $push: { addresses: { ...address, label: 'Home', isDefault: user.addresses.length === 0 } } }
        );
      }
    }

    res.status(201).json({ success: true, data: { order, payment } });
  } catch (err) {
    // Roll back reservations so a failed checkout never leaks stock or coupon uses.
    if (order) {
      await Order.updateOne(
        { _id: order._id },
        { $set: { status: 'cancelled', cancelledAt: new Date() }, $push: { statusHistory: { status: 'cancelled', note: 'Checkout failed' } } }
      );
      await releaseOrderStock(order); // also releases the coupon use
    } else {
      await Product.bulkWrite(
        items.map((l) => ({
          updateOne: { filter: { _id: l.product }, update: { $inc: { stock: l.quantity, soldCount: -l.quantity } } },
        }))
      );
      if (couponClaimed) await Coupon.updateOne({ code: summary.coupon.code }, { $inc: { usedCount: -1 } });
    }
    throw err;
  }
});

/** GET /orders/my */
export const myOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10 });
  const filter = { user: req.user._id };
  const [data, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('orderNumber items pricing payment.method payment.status status createdAt')
      .lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(page, limit, total) });
});

/** GET /orders/:id (owner or admin) */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await findOrderForUser(req.params.id, req.user);
  if (req.user.role === 'admin') await order.populate('user', 'name email phone');
  const data = order.toObject();
  if (req.user.role !== 'admin') delete data.adminNote;
  delete data.payment.razorpaySignature;
  res.json({ success: true, data });
});

/** POST /orders/:id/cancel (customer) */
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await findOrderForUser(req.params.id, req.user);
  if (!order.user.equals(req.user._id)) throw ApiError.notFound('Order not found');
  if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
    throw ApiError.badRequest('This order can no longer be cancelled');
  }
  await changeOrderStatus(order, {
    status: 'cancelled',
    note: req.body?.reason ? `Cancelled by customer: ${String(req.body.reason).slice(0, 200)}` : 'Cancelled by customer',
    by: req.user._id,
  });
  res.json({ success: true, data: order });
});

/** GET /orders/track?orderNumber=&email= (public) */
export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.query.orderNumber.toUpperCase(), email: req.query.email })
    .select('orderNumber status statusHistory tracking items.name items.quantity items.image pricing.total payment.method payment.status shippingAddress.city shippingAddress.state createdAt deliveredAt')
    .lean();
  if (!order) throw ApiError.notFound('No order found with those details');
  res.json({ success: true, data: order });
});

/* ---------- Admin ---------- */

/** GET /orders (admin) */
export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = {};
  if (req.query.status && ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.paymentStatus) filter['payment.status'] = req.query.paymentStatus;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = req.query.from;
    if (req.query.to) filter.createdAt.$lte = new Date(new Date(req.query.to).setHours(23, 59, 59, 999));
  }
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ orderNumber: rx }, { email: rx }, { 'shippingAddress.fullName': rx }, { 'shippingAddress.phone': rx }];
  }
  const [data, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('orderNumber email shippingAddress.fullName items.quantity pricing.total payment.method payment.status status createdAt')
      .lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: paginationMeta(page, limit, total) });
});

/** PATCH /orders/:id/status (admin) */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  await changeOrderStatus(order, { ...req.body, by: req.user._id });
  await order.populate('user', 'name email phone');
  res.json({ success: true, data: order });
});

/** PATCH /orders/:id/note (admin) */
export const updateAdminNote = asyncHandler(async (req, res) => {
  const note = String(req.body?.adminNote ?? '').slice(0, 1000);
  const order = await Order.findByIdAndUpdate(req.params.id, { $set: { adminNote: note } }, { new: true });
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ success: true, data: order });
});

export const orderMeta = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { statuses: ORDER_STATUSES, currency: env.commerce.currency } });
});
