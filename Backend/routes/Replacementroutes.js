import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import {getReplacementOrders , getReplacementById , addReplacementNote , updateReplacementShipping , updateReplacementStatus} from "../controllers/ReplacementOrdercontrollers.js"

const router = express.Router();

router.get('/replacements', protect, getReplacementOrders);
router.get('/replacement/:id', protect, getReplacementById);
router.post('/replacement/:id/note', protect, addReplacementNote);
router.patch('/replacement/:id/shipping', protect, updateReplacementShipping);
router.patch('/replacement/:id/status', protect, updateReplacementStatus);   

export default router;