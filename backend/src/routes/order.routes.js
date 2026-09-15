import { Router } from 'express';
import * as ctrl from '../controllers/order.controller.js';
import { adminOnly, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  idParam,
  orderQuerySchema,
  trackOrderSchema,
  updateOrderStatusSchema,
} from '../validators/schemas.js';

const router = Router();

// Public
router.get('/track', validate({ query: trackOrderSchema }), ctrl.trackOrder);

// Customer
router.post('/', protect, validate({ body: createOrderSchema }), ctrl.createOrder);
router.get('/my', protect, ctrl.myOrders);

// Admin
router.get('/meta', adminOnly, ctrl.orderMeta);
router.get('/', adminOnly, validate({ query: orderQuerySchema }), ctrl.listOrders);
router.patch('/:id/status', adminOnly, validate({ params: idParam, body: updateOrderStatusSchema }), ctrl.updateOrderStatus);
router.patch('/:id/note', adminOnly, validate({ params: idParam }), ctrl.updateAdminNote);

// Owner or admin
router.get('/:id', protect, validate({ params: idParam }), ctrl.getOrder);
router.post('/:id/cancel', protect, validate({ params: idParam }), ctrl.cancelMyOrder);

export default router;
