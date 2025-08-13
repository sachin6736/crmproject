import express from 'express';
import { getProcurementOrders, getProcurementOrderStatusComparison, getProcurementOrderAmountTotals,getProcurementDeliveredMetrics } from '../controllers/procurementController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

router.get('/getProcurementOrders', protect, getProcurementOrders);
router.get('/getProcurementOrderStatusComparison', protect, getProcurementOrderStatusComparison);
router.get('/getProcurementOrderAmountTotals', protect, getProcurementOrderAmountTotals);
router.get('/getProcurementDeliveredMetrics', getProcurementDeliveredMetrics);

export default router;