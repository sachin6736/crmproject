import express from "express";
import { createOrder, getAllOrders } from "../controllers/Order.js";
import {protect} from "../middleware/authmiddleware.js"

const router = express.Router();

router.post('/create',protect,createOrder);
router.get('/getallorders',getAllOrders);






export default router;