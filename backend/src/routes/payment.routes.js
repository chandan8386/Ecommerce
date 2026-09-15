import { Router } from 'express';
import * as ctrl from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParam, paymentFailedSchema, verifyPaymentSchema } from '../validators/schemas.js';

// NOTE: the webhook route is mounted in app.js with a raw body parser.
const router = Router();

router.get('/config', ctrl.getPaymentConfig);
router.post('/razorpay/orders/:id', protect, validate({ params: idParam }), ctrl.retryPayment);
router.post('/razorpay/verify', protect, validate({ body: verifyPaymentSchema }), ctrl.verifyPayment);
router.post('/razorpay/failed', protect, validate({ body: paymentFailedSchema }), ctrl.paymentFailed);

export default router;
