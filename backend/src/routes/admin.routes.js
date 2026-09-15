import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller.js';
import { adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { customerQuerySchema, idParam, reportQuerySchema } from '../validators/schemas.js';

const router = Router();
router.use(adminOnly);

router.get('/dashboard', ctrl.getDashboard);
router.get('/reports/sales', validate({ query: reportQuerySchema }), ctrl.getSalesReport);
router.get('/customers', validate({ query: customerQuerySchema }), ctrl.listCustomers);
router.get('/customers/:id', validate({ params: idParam }), ctrl.getCustomer);
router.patch('/customers/:id/block', validate({ params: idParam }), ctrl.setCustomerBlocked);

export default router;
