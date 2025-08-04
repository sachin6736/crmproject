import express from 'express';
import { getcountbystatus, getleadcount,getmyteam,getorders,getLeadCreationCounts,getLeadStatusComparison  } from '../controllers/dashboardcontrollers.js';

const router = express.Router();

router.get('/getleadcount',getleadcount);
router.get('/getcountbystatus',getcountbystatus);
router.get('/getallorders',getorders);
router.get('/getmyteam',getmyteam);
router.get("/getLeadCreationCounts", getLeadCreationCounts);
router.get("/getLeadStatusComparison", getLeadStatusComparison);


export default router;