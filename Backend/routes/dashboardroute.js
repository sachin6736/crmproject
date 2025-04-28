import express from 'express';
import { getcountbystatus, getleadcount,getmyteam,getorders  } from '../controllers/Admin/dashboardcontrollers.js';

const router = express.Router();

router.get('/getleadcount',getleadcount);
router.get('/getcountbystatus',getcountbystatus);
router.get('/getallorders',getorders);
router.get('/getmyteam',getmyteam)


export default router;