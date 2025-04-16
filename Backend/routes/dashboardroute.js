import express from 'express';
import { getcountbystatus, getleadcount,getorders } from '../controllers/dashboardcontrollers.js';

const router = express.Router();

router.get('/getleadcount',getleadcount);
router.get('/getcountbystatus',getcountbystatus);
router.get('/getallorders',getorders);


export default router;