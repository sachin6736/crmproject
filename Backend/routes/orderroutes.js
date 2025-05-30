import express from "express";
import { createOrder, getAllOrders, getMyOrders,getCustomerOrders, orderbyid, checkOrderByLeadId , addVendorToOrder, addNoteToOrder,getAllVendors} from "../controllers/Order.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/create", protect, createOrder);
router.get("/getallorders", getAllOrders);
router.get("/getmyorders", protect, getMyOrders);
router.get("/getcustomerorders", protect, getCustomerOrders);
router.get("/orderbyid/:id",protect ,orderbyid);
router.get("/checkorderbylead/:leadId", protect, checkOrderByLeadId);
router.post('/:orderId/vendor', addVendorToOrder);
router.post('/:orderId/notes', addNoteToOrder);

router.get('/getallvendors',getAllVendors);

export default router;