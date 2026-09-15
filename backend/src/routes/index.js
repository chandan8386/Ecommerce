import { Router } from 'express';
import mongoose from 'mongoose';
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
  res.json({
    success: true,
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
  });
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
