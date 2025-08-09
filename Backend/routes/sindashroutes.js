import express from 'express';
import { singleleads, changestatus, getStatusDurations, getAllUsers, getsingleorders, getOrderStatusComparison, getLeadStatusComparison, getLeadCreationCounts, getOrderAmountTotals } from '../controllers/singledashboard.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

router.get('/getsingleleads', protect, singleleads);
router.get('/getsingleorders', protect, getsingleorders);
router.get('/getOrderStatusComparison', protect, getOrderStatusComparison);
router.get('/getLeadStatusComparison', protect, getLeadStatusComparison);
router.get('/getLeadCreationCounts', protect, getLeadCreationCounts);
router.get('/status-logs/:userId', protect, getStatusDurations);
router.post('/changestatus/:id', protect, changestatus);
router.get('/all', getAllUsers);
router.get('/getOrderAmountTotals', protect, getOrderAmountTotals);

export default router;