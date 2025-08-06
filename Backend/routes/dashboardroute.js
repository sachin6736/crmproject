import express from 'express';
import { getcountbystatus, getleadcount,getmyteam,getorders,getLeadCreationCounts,getLeadStatusComparison,getOrderStatusComparison  } from '../controllers/dashboardcontrollers.js';

const router = express.Router();

router.get('/getleadcount',getleadcount);
router.get('/getcountbystatus',getcountbystatus);
router.get('/getallorders',getorders);
router.get('/getmyteam',getmyteam);
router.get("/getLeadCreationCounts", getLeadCreationCounts);
router.get("/getLeadStatusComparison", getLeadStatusComparison);
router.get("/getOrderStatusComparison", getOrderStatusComparison);


export default router;