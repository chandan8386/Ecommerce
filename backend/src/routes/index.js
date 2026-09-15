import { Router } from 'express';
import mongoose from 'mongoose';
import { dbState } from '../config/db.js';
import { configStatus, env } from '../config/env.js';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import bannerRoutes from './banner.routes.js';
import cartRoutes from './cart.routes.js';
import categoryRoutes from './category.routes.js';
import couponRoutes from './coupon.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import productRoutes from './product.routes.js';
import userRoutes from './user.routes.js';
import wishlistRoutes from './wishlist.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  const healthy = connected && configStatus.errors.length === 0;
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'degraded',
    db: connected ? 'connected' : 'disconnected',
    dbError: connected ? undefined : dbState.lastError,
    dbAttempts: dbState.attempts,
    environment: env.nodeEnv,
    payments: env.razorpay.enabled ? 'razorpay' : env.razorpay.mock ? 'mock' : 'disabled',
    images: env.cloudinary.enabled ? 'cloudinary' : 'local',
    allowedOrigins: env.clientUrls,
    configErrors: configStatus.errors,
    configWarnings: configStatus.warnings,
    uptime: Math.round(process.uptime()),
  });
});

// Fail fast with a clear message instead of letting requests hang while the database is unavailable.
router.use((_req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  res.status(503).json({ success: false, message: 'The store is starting up or its database is unavailable. Please try again shortly.' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/coupons', couponRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/banners', bannerRoutes);
router.use('/admin', adminRoutes);

export default router;
