const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port: toNumber(process.env.PORT, 5000),
  apiUrl: (process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, ''),
  storeUrl: (process.env.STORE_URL || 'http://localhost:5173').replace(/\/$/, ''),
  clientUrls: (process.env.CLIENT_URLS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aurum_jewelry',

  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'aurum-jewelry',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  commerce: {
    currency: process.env.CURRENCY || 'INR',
    taxRate: toNumber(process.env.TAX_RATE, 3),
    shippingFee: toNumber(process.env.SHIPPING_FEE, 99),
    freeShippingThreshold: toNumber(process.env.FREE_SHIPPING_THRESHOLD, 999),
    pendingOrderTtlMinutes: toNumber(process.env.PENDING_ORDER_TTL_MINUTES, 30),
  },
};

env.cloudinary.enabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
env.razorpay.enabled = Boolean(env.razorpay.keyId && env.razorpay.keySecret);
// Mock gateway lets the full checkout flow run locally without Razorpay keys.
env.razorpay.mock = !env.razorpay.enabled && !env.isProd;

export function assertEnv() {
  const problems = [];
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    if (env.isProd) problems.push('JWT_SECRET must be set and at least 32 characters');
    else {
      env.jwtSecret = 'dev-only-insecure-jwt-secret-please-change-me-0123456789';
      console.warn('[env] JWT_SECRET missing/short - using an insecure development secret');
    }
  }
  if (env.isProd && !env.razorpay.enabled) {
    problems.push('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required in production');
  }
  if (problems.length) {
    throw new Error(`Invalid environment configuration:\n - ${problems.join('\n - ')}`);
  }
}
