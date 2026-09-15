import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

let client = null;
const getClient = () => {
  if (!env.razorpay.enabled) return null;
  if (!client) client = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return client;
};

const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

export const paymentConfig = () => ({
  provider: 'razorpay',
  keyId: env.razorpay.enabled ? env.razorpay.keyId : '',
  mock: env.razorpay.mock,
  currency: env.commerce.currency,
});

/** Creates a Razorpay order for an app order. Amount is in the smallest currency unit (paise). */
export async function createGatewayOrder(order) {
  const amount = Math.round(order.pricing.total * 100);
  const rzp = getClient();
  if (!rzp) {
    if (!env.razorpay.mock) throw new ApiError(503, 'Online payments are not configured');
    return { id: `mock_order_${crypto.randomBytes(8).toString('hex')}`, amount, currency: order.pricing.currency };
  }
  try {
    return await rzp.orders.create({
      amount,
      currency: order.pricing.currency,
      receipt: order.orderNumber,
      notes: { orderId: order._id.toString() },
    });
  } catch (err) {
    console.error('[payment] razorpay order create failed', err?.error || err);
    throw new ApiError(502, 'Could not initiate payment with Razorpay. Please try again.');
  }
}

export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (env.razorpay.mock) {
    return razorpayOrderId.startsWith('mock_order_') && razorpaySignature === 'mock_signature';
  }
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return safeEqual(expected, razorpaySignature);
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!env.razorpay.webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

export async function refundPayment(paymentId, amountInRupees) {
  const rzp = getClient();
  if (!rzp || !paymentId) return null;
  return rzp.payments.refund(paymentId, { amount: Math.round(amountInRupees * 100) });
}
