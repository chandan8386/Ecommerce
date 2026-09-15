import { Router } from 'express';
import * as ctrl from '../controllers/banner.controller.js';
import { adminOnly } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { bannerSchema, bannerUpdateSchema, idParam } from '../validators/schemas.js';

const router = Router();

router.get('/', ctrl.listActiveBanners);
router.get('/admin/all', adminOnly, ctrl.adminListBanners);
router.post('/', adminOnly, uploadSingle('image'), validate({ body: bannerSchema }), ctrl.createBanner);
router.put('/:id', adminOnly, uploadSingle('image'), validate({ params: idParam, body: bannerUpdateSchema }), ctrl.updateBanner);
router.delete('/:id', adminOnly, validate({ params: idParam }), ctrl.deleteBanner);

export default router;
