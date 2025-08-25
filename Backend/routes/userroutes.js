import express from "express";
import { getCurrentUser, pauseandresume, reassign, resetpassword ,rolechange , updateUserAccess} from "../controllers/Usercontrollers.js";
import {protect} from "../middleware/authmiddleware.js"

const router = express.Router();

router.get('/me',protect,getCurrentUser)
router.patch('/Resetpassword/:id',protect,resetpassword)//RESETTING PASSWORD
router.patch('/Pauseandresume/:id',protect,pauseandresume)//PAUSING AND RESUMING A USER
router.patch('/Changerole/:id',protect,rolechange)//changing user role
router.post('/Reassign/:id',protect,reassign)//asigning leads
router.patch('/:id/access', protect, updateUserAccess);//grant access





export default router; 