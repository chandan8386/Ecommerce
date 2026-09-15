import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { objectId } from '../validators/schemas.js';

const router = Router();
const productParam = z.object({ productId: objectId });

router.use(protect);
router.get('/', ctrl.getWishlist);
router.post('/:productId', validate({ params: productParam }), ctrl.addToWishlist);
router.delete('/:productId', validate({ params: productParam }), ctrl.removeFromWishlist);

export default router;
