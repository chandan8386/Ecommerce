import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { releaseOrderStock, reserveStock } from './inventory.service.js';
import { refundPayment } from './payment.service.js';

export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'returned'],
  out_for_delivery: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const CUSTOMER_CANCELLABLE = ['pending', 'confirmed', 'processing'];

/**
 * Marks an order as paid. Idempotent — safe to call from both the client verify
 * callback and the Razorpay webhook. If the order had already expired, stock is
 * re-reserved; if that fails the payment is refunded.
 */
export async function markOrderPaid(order, { paymentId, signature }) {
  if (order.payment.status === 'paid') return order;

  if (order.status === 'cancelled') {
    try {
      await reserveStock(order.items);
      order.stockReleased = false;
      order.status = 'confirmed';
      order.cancelledAt = undefined;
      order.statusHistory.push({ status: 'confirmed', note: 'Payment received after expiry; order reinstated' });
    } catch {
      order.payment.status = 'refunded';
      order.payment.razorpayPaymentId = paymentId;
      order.adminNote = `${order.adminNote || ''}\nPayment received after cancellation; auto-refund initiated.`.trim();
      await order.save();
      await refundPayment(paymentId, order.pricing.total).catch((e) =>
        console.error('[payment] auto-refund failed', order.orderNumber, e?.error || e)
      );
      return order;
    }
  }

  order.payment.status = 'paid';
  order.payment.razorpayPaymentId = paymentId;
  if (signature) order.payment.razorpaySignature = signature;
  order.payment.paidAt = new Date();
  order.payment.failureReason = undefined;
  order.expiresAt = null;
  if (order.status === 'pending') {
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', note: 'Payment successful' });
  }
  await order.save();
  await Cart.updateOne({ user: order.user }, { $set: { items: [] } });
  return order;
}

/** Applies a status change, enforcing allowed transitions and side effects. */
export async function changeOrderStatus(order, { status, note, tracking, by, isAdmin = true }) {
  const allowed = STATUS_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(`Cannot change order from "${order.status}" to "${status}"`);
  }
  if (status === 'confirmed' && order.payment.method === 'razorpay' && order.payment.status !== 'paid') {
    throw ApiError.badRequest('Online payment has not been received for this order');
  }

  order.status = status;
  order.statusHistory.push({ status, note: note || '', by });
  if (tracking) {
    const current = order.tracking || {};
    order.tracking = {
      courier: tracking.courier ?? current.courier ?? '',
      trackingNumber: tracking.trackingNumber ?? current.trackingNumber ?? '',
      url: tracking.url ?? current.url ?? '',
    };
  }

  if (status === 'delivered') {
    order.deliveredAt = new Date();
    if (order.payment.method === 'cod' && order.payment.status !== 'paid') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
    }
  }

  if (status === 'cancelled' || status === 'returned') {
    if (status === 'cancelled') order.cancelledAt = new Date();
    if (order.payment.method === 'razorpay' && order.payment.status === 'paid') {
      try {
        await refundPayment(order.payment.razorpayPaymentId, order.pricing.total);
        order.payment.status = 'refunded';
      } catch (err) {
        console.error('[payment] refund failed', order.orderNumber, err?.error || err);
        order.adminNote = `${order.adminNote || ''}\nAutomatic refund failed - process manually.`.trim();
      }
    } else if (order.payment.method === 'cod' && order.payment.status === 'paid' && status === 'returned') {
      order.payment.status = 'refunded';
    }
  }

  await order.save();
  if (status === 'cancelled' || status === 'returned') await releaseOrderStock(order);
  return order;
}

export async function findOrderForUser(id, user) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');
  if (user.role !== 'admin' && !order.user.equals(user._id)) throw ApiError.notFound('Order not found');
  return order;
}
