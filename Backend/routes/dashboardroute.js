import express from 'express';
import { getcountbystatus, getleadcount, getmyteam, getorders, getLeadCreationCounts, getLeadStatusComparison, getOrderStatusComparison, getOrderAmountTotals,getPoSentCountsAndTotals ,getDeliveredMetrics,getOrderCounts,getLeadCountsAndConversions } from '../controllers/dashboardcontrollers.js';

const router = express.Router();

router.get('/getleadcount', getleadcount);
router.get('/getcountbystatus', getcountbystatus);
router.get('/getallorders', getorders);
router.get('/getmyteam', getmyteam);
router.get("/getLeadCreationCounts", getLeadCreationCounts);
router.get("/getLeadStatusComparison", getLeadStatusComparison);
router.get("/getOrderStatusComparison", getOrderStatusComparison);
router.get("/getOrderAmountTotals", getOrderAmountTotals);
router.get("/getPoSentCountsAndTotals", getPoSentCountsAndTotals);
router.get('/getDeliveredMetrics',  getDeliveredMetrics);
router.get("/getOrderCounts", getOrderCounts);
router.get("/getLeadCountsAndConversions", getLeadCountsAndConversions);

export default router;