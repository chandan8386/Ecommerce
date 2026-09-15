import { Router } from 'express';
import * as ctrl from '../controllers/coupon.controller.js';
import { adminOnly, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { applyCouponSchema, couponSchema, idParam } from '../validators/schemas.js';

const router = Router();

router.get('/available', ctrl.availableCoupons);
router.post('/apply', protect, validate({ body: applyCouponSchema }), ctrl.applyCoupon);

router.get('/', adminOnly, ctrl.listCoupons);
router.post('/', adminOnly, validate({ body: couponSchema }), ctrl.createCoupon);
router.put('/:id', adminOnly, validate({ params: idParam, body: couponSchema }), ctrl.updateCoupon);
router.delete('/:id', adminOnly, validate({ params: idParam }), ctrl.deleteCoupon);

export default router;
