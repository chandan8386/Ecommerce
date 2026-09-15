import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, loginSchema, registerSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), ctrl.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), ctrl.login);
router.post('/admin/login', authLimiter, validate({ body: loginSchema }), ctrl.adminLogin);
router.get('/me', protect, ctrl.me);
router.patch('/password', protect, validate({ body: changePasswordSchema }), ctrl.changePassword);
router.post('/logout-all', protect, ctrl.logoutAll);

export default router;
