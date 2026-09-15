import crypto from 'node:crypto';

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// Render sets RENDER=true; treat it as production even if NODE_ENV was forgotten.
const nodeEnv = process.env.NODE_ENV || (process.env.RENDER ? 'production' : 'development');

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
env.razorpay.mock = !env.razorpay.enabled && !env.isProd && !process.env.RENDER;

/** Configuration problems, reported (by name only, never values) at GET /api/health. */
export const configStatus = { errors: [], warnings: [] };

/**
 * Validates configuration without ever exiting the process, so a misconfigured deploy still
 * answers /api/health with a precise explanation instead of crash-looping silently.
 */
export function assertEnv() {
  const { errors, warnings } = configStatus;

  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    if (env.isProd) {
      env.jwtSecret = crypto.randomBytes(48).toString('hex');
      warnings.push('JWT_SECRET is not set (or shorter than 32 characters): using a random secret, so users are signed out on every restart');
    } else {
      env.jwtSecret = 'dev-only-insecure-jwt-secret-please-change-me-0123456789';
      warnings.push('JWT_SECRET missing/short: using an insecure development secret');
    }
  }
  if (env.isProd && !process.env.MONGO_URI) {
    errors.push('MONGO_URI is not set: add your MongoDB Atlas connection string');
  }
  if (env.isProd && !env.razorpay.enabled) {
    warnings.push('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set: online payments are disabled (Cash on Delivery still works)');
  }
  if (env.isProd && env.clientUrls.every((u) => /localhost|127\.0\.0\.1/.test(u))) {
    warnings.push('CLIENT_URLS only allows localhost: browsers on your live sites will be blocked by CORS');
  }

  for (const e of errors) console.error(`[env] ERROR: ${e}`);
  for (const w of warnings) console.warn(`[env] WARNING: ${w}`);
}
