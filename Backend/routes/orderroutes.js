import express from "express";
import { createOrder, getAllOrders , getMyOrders } from "../controllers/Order.js";
import {protect} from "../middleware/authmiddleware.js"

const router = express.Router();

router.post('/create',protect,createOrder);
router.get('/getallorders',getAllOrders);
router.get('/getmyorders',protect,getMyOrders)






export default router;