import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'pending', // awaiting online payment
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: String,
    sku: String,
    image: String,
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },

    pricing: {
      subtotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },
    coupon: {
      code: { type: String, default: '' },
      discount: { type: Number, default: 0 },
    },

    payment: {
      method: { type: String, enum: ['razorpay', 'cod'], required: true },
      status: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
      razorpayOrderId: { type: String, index: true, sparse: true },
      razorpayPaymentId: String,
      razorpaySignature: String,
      paidAt: Date,
      failureReason: String,
    },

    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        note: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        _id: false,
      },
    ],
    tracking: {
      courier: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      url: { type: String, default: '' },
    },
    customerNote: { type: String, maxlength: 500, default: '' },
    adminNote: { type: String, maxlength: 1000, default: '' },

    stockReleased: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null }, // unpaid online orders auto-cancel after this
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, expiresAt: 1 });

export const Order = mongoose.model('Order', orderSchema);
