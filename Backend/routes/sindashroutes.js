import express from 'express';
import { singleleads ,changestatus , getStatusDurations , getAllUsers } from '../controllers/singledashboard.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();


router.get('/getsingleleads',protect,singleleads);
router.get('/status-logs/:userId',protect, getStatusDurations);
router.post('/changestatus/:id',protect,changestatus);
router.get('/all', getAllUsers);





export default router;

