import { Router } from 'express';
import * as ctrl from '../controllers/product.controller.js';
import { adminOnly } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  idParam,
  inventoryUpdateSchema,
  productQuerySchema,
  productSchema,
  productUpdateSchema,
} from '../validators/schemas.js';

const router = Router();

// Public
router.get('/', validate({ query: productQuerySchema }), ctrl.listProducts);
router.get('/filters', ctrl.getFilterOptions);
router.get('/suggest', ctrl.suggestProducts);
router.get('/slug/:slug', ctrl.getProductBySlug);

// Admin
router.get('/admin/list', adminOnly, validate({ query: productQuerySchema }), ctrl.adminListProducts);
router.patch('/inventory', adminOnly, validate({ body: inventoryUpdateSchema }), ctrl.updateInventory);
router.get('/:id', adminOnly, validate({ params: idParam }), ctrl.getProductById);
router.post('/', adminOnly, uploadImages('images'), validate({ body: productSchema }), ctrl.createProduct);
router.put('/:id', adminOnly, uploadImages('images'), validate({ params: idParam, body: productUpdateSchema }), ctrl.updateProduct);
router.delete('/:id', adminOnly, validate({ params: idParam }), ctrl.deleteProduct);

export default router;
