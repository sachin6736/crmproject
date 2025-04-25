import express from "express";
import { pauseandresume, resetpassword } from "../controllers/Usercontrollers.js";
import {protect} from "../middleware/authmiddleware.js"

const router = express.Router();

router.post('/Resetpassword/:id',protect,resetpassword)//RESETTING PASSWORD
router.patch('/Pauseandresume/:id',protect,pauseandresume)//PAUSING AND RESUMING A USER






export default router;