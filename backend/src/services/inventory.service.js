import { env } from '../config/env.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Atomically reserves stock for each line. Each decrement only succeeds if enough
 * stock remains, so concurrent checkouts can never oversell. On any failure the
 * already-reserved lines are rolled back.
 */
export async function reserveStock(lines) {
  const reserved = [];
  for (const line of lines) {
    const res = await Product.updateOne(
      { _id: line.product, isActive: true, stock: { $gte: line.quantity } },
      { $inc: { stock: -line.quantity, soldCount: line.quantity } }
    );
    if (res.modifiedCount !== 1) {
      await releaseLines(reserved);
      throw ApiError.conflict(`Sorry, "${line.name}" does not have enough stock for this order`);
    }
    reserved.push(line);
  }
}

async function releaseLines(lines) {
  if (!lines.length) return;
  await Product.bulkWrite(
    lines.map((l) => ({
      updateOne: {
        filter: { _id: l.product },
        update: { $inc: { stock: l.quantity, soldCount: -l.quantity } },
      },
    }))
  );
}

/** Returns an order's stock to inventory exactly once. */
export async function releaseOrderStock(order) {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, stockReleased: false },
    { $set: { stockReleased: true } },
    { new: true }
  );
  if (!claimed) return false;
  await releaseLines(order.items);
  if (order.coupon?.code) {
    await Coupon.updateOne({ code: order.coupon.code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
  return true;
}

/** Cancels unpaid online orders past their expiry and releases their stock. */
export async function expirePendingOrders() {
  const expired = await Order.find({
    status: 'pending',
    'payment.status': { $in: ['pending', 'failed'] },
    expiresAt: { $ne: null, $lte: new Date() },
  }).limit(200);

  for (const order of expired) {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: 'pending' },
      {
        $set: { status: 'cancelled', cancelledAt: new Date() },
        $push: { statusHistory: { status: 'cancelled', note: 'Payment not completed in time' } },
      },
      { new: true }
    );
    if (updated) await releaseOrderStock(updated);
  }
  return expired.length;
}

export function startOrderExpiryJob() {
  const intervalMs = 60 * 1000;
  const run = () =>
    expirePendingOrders()
      .then((n) => n && console.log(`[jobs] expired ${n} unpaid order(s)`))
      .catch((err) => console.error('[jobs] order expiry failed', err.message));
  const timer = setInterval(run, intervalMs);
  timer.unref();
  run();
  return timer;
}

export const pendingOrderExpiry = () =>
  new Date(Date.now() + env.commerce.pendingOrderTtlMinutes * 60 * 1000);
