import express from "express";
import { createOrder, getAllOrders, getMyOrders, orderbyid, checkOrderByLeadId , addVendorToOrder, addNoteToOrder} from "../controllers/Order.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/create", protect, createOrder);
router.get("/getallorders", getAllOrders);
router.get("/getmyorders", protect, getMyOrders);
router.get("/orderbyid/:id", orderbyid);
router.get("/checkorderbylead/:leadId", protect, checkOrderByLeadId);
router.post('/:orderId/vendor', addVendorToOrder);
router.post('/:orderId/notes', addNoteToOrder);

export default router;