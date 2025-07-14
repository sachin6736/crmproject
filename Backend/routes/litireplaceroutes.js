import express from 'express';
import { protect } from "../middleware/authmiddleware.js";
import { getLitigation } from '../controllers/litireplace.js';

const router = express.Router(); 

router.get("/getLitigation",protect,getLitigation) 





export default router;