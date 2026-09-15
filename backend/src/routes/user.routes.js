import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addressSchema, idParam, updateProfileSchema } from '../validators/schemas.js';

const router = Router();
router.use(protect);

router.patch('/me', validate({ body: updateProfileSchema }), ctrl.updateProfile);
router.get('/me/addresses', ctrl.listAddresses);
router.post('/me/addresses', validate({ body: addressSchema }), ctrl.addAddress);
router.put('/me/addresses/:id', validate({ params: idParam, body: addressSchema }), ctrl.updateAddress);
router.delete('/me/addresses/:id', validate({ params: idParam }), ctrl.deleteAddress);
router.patch('/me/addresses/:id/default', validate({ params: idParam }), ctrl.setDefaultAddress);

export default router;
