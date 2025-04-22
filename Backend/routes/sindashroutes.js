import express from 'express';
import { singleleads } from '../controllers/singledashboard.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();


router.get('/getsingleleads',protect,singleleads)





export default router;

