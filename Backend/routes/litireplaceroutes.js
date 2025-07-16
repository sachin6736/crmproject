import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { getLitigation, updateOrderStatus } from "../controllers/litireplace.js";

const router = express.Router();

router.get("/getLitigation", protect, getLitigation);
router.patch("/updateStatus/:orderId", protect, updateOrderStatus);

export default router;