import express from 'express';
import { getCustomerRelationsOrders, getCustomerRelationsOrderStatusComparison, getCustomerRelationsOrderAmountTotals, getCustomerRelationsDeliveredMetrics } from '../controllers/customerController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

router.get('/getCustomerRelationsOrders', protect, getCustomerRelationsOrders);
router.get('/getCustomerRelationsOrderStatusComparison', protect, getCustomerRelationsOrderStatusComparison);
router.get('/getCustomerRelationsOrderAmountTotals', protect, getCustomerRelationsOrderAmountTotals);
router.get('/getCustomerRelationsDeliveredMetrics', protect, getCustomerRelationsDeliveredMetrics);

export default router;