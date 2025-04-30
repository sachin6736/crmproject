import express from 'express';
import { singleleads ,changestatus } from '../controllers/singledashboard.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();


router.get('/getsingleleads',protect,singleleads);
router.post('/changestatus/:id',protect,changestatus)





export default router;

