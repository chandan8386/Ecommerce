import { Order } from '../models/Order.js';
import { markOrderPaid } from '../services/order.service.js';
import {
  createGatewayOrder,
  paymentConfig,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/payment.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paymentPayload } from './order.controller.js';

/** GET /payments/config */
export const getPaymentConfig = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: paymentConfig() });
});

/** POST /payments/razorpay/orders/:id — (re)start online payment for an existing unpaid order */
export const retryPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.payment.method !== 'razorpay') throw ApiError.badRequest('This order is not an online payment order');
  if (order.payment.status === 'paid') throw ApiError.badRequest('This order is already paid');
  if (order.status !== 'pending') throw ApiError.badRequest('This order can no longer be paid. Please place a new order.');

  const gatewayOrder = await createGatewayOrder(order);
  order.payment.razorpayOrderId = gatewayOrder.id;
  order.payment.status = 'pending';
  await order.save();
  res.json({ success: true, data: paymentPayload(order, req.user, gatewayOrder) });
});

/** POST /payments/razorpay/verify — called by the storefront after Razorpay checkout succeeds */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature } = req.body;

  const order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found for this payment');

  if (!verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
    order.payment.status = 'failed';
    order.payment.failureReason = 'Signature verification failed';
    await order.save();
    throw ApiError.badRequest('Payment verification failed');
  }

  await markOrderPaid(order, { paymentId: razorpayPaymentId, signature: razorpaySignature });
  res.json({ success: true, data: { orderId: order._id, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.payment.status } });
});

/** POST /payments/razorpay/failed — records a failed/dismissed checkout attempt */
export const paymentFailed = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.payment.status !== 'paid') {
    order.payment.status = 'failed';
    order.payment.failureReason = req.body.reason || 'Payment was not completed';
    await order.save();
  }
  res.json({ success: true, data: { orderId: order._id, expiresAt: order.expiresAt } });
});

/**
 * POST /payments/razorpay/webhook — server-to-server confirmation from Razorpay.
 * Mounted with express.raw() so the signature is computed over the exact bytes.
 */
export const razorpayWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }
  try {
    const event = JSON.parse(req.body.toString('utf8'));
    const payment = event?.payload?.payment?.entity;
    if (payment?.order_id) {
      const order = await Order.findOne({ 'payment.razorpayOrderId': payment.order_id });
      if (order) {
        if (event.event === 'payment.captured' || event.event === 'order.paid') {
          await markOrderPaid(order, { paymentId: payment.id });
        } else if (event.event === 'payment.failed' && order.payment.status !== 'paid') {
          order.payment.status = 'failed';
          order.payment.failureReason = payment.error_description || 'Payment failed';
          await order.save();
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[webhook] processing failed', err);
    // 500 makes Razorpay retry later
    res.status(500).json({ success: false });
  }
};
