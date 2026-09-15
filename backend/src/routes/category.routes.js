import { Router } from 'express';
import * as ctrl from '../controllers/category.controller.js';
import { adminOnly } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { categorySchema, categoryUpdateSchema, idParam } from '../validators/schemas.js';

const router = Router();

router.get('/', ctrl.listCategories);
router.get('/admin/all', adminOnly, ctrl.adminListCategories);
router.get('/:slug', ctrl.getCategory);

router.post('/', adminOnly, uploadSingle('image'), validate({ body: categorySchema }), ctrl.createCategory);
router.put('/:id', adminOnly, uploadSingle('image'), validate({ params: idParam, body: categoryUpdateSchema }), ctrl.updateCategory);
router.delete('/:id', adminOnly, validate({ params: idParam }), ctrl.deleteCategory);

export default router;
