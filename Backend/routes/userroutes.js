import express from "express";
import { pauseandresume, reassign, resetpassword ,rolechange} from "../controllers/Admin/Usercontrollers.js";
import {protect} from "../middleware/authmiddleware.js"

const router = express.Router();

router.post('/Resetpassword/:id',protect,resetpassword)//RESETTING PASSWORD
router.patch('/Pauseandresume/:id',protect,pauseandresume)//PAUSING AND RESUMING A USER
router.put('/Changerole/:id',protect,rolechange)//changing user role
router.post('/Reassign/:id',reassign)//asigning leads





export default router;