import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.use(authenticate);

router.get('/owner', authorize('owner'), analyticsController.ownerAnalytics);
router.get('/admin', authorize('admin'), analyticsController.adminAnalytics);
router.get('/customer', authorize('customer'), analyticsController.customerAnalytics);

export default router;
