import express from 'express';
import { getcountbystatus, getleadcount } from '../controllers/dashboardcontrollers.js';

const router = express.Router();

router.get('/getleadcount',getleadcount);
router.get('/getcountbystatus',getcountbystatus)

export default router;