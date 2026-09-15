import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addToCartSchema, mergeCartSchema, objectId, updateCartItemSchema } from '../validators/schemas.js';

const router = Router();
const itemParam = z.object({ itemId: objectId });

router.use(protect);
router.get('/', ctrl.getCart);
router.post('/items', validate({ body: addToCartSchema }), ctrl.addItem);
router.patch('/items/:itemId', validate({ params: itemParam, body: updateCartItemSchema }), ctrl.updateItem);
router.delete('/items/:itemId', validate({ params: itemParam }), ctrl.removeItem);
router.delete('/', ctrl.clearCart);
router.post('/merge', validate({ body: mergeCartSchema }), ctrl.mergeCart);

export default router;
