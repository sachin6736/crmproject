import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

router.get('/user/:userId', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);

export default router;
