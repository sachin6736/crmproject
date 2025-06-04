import express from "express";
import { createOrder, getAllOrders, getMyOrders,getCustomerOrders, orderbyid, checkOrderByLeadId , addVendorToOrder, addNoteToOrder,getAllVendors,sendPurchaseorder , getProcurementOrders,changeOrderStatus} from "../controllers/Order.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/create", protect, createOrder);
router.get("/getallorders", getAllOrders); //getting all orders by admin
router.get("/getmyorders", protect, getMyOrders); //getting orders by sales teams
router.get("/getcustomerorders", protect, getCustomerOrders); //geting orders by customer realtions team
router.get("/orderbyid/:id",protect ,orderbyid); // getting single order by id
router.get("/checkorderbylead/:leadId", protect, checkOrderByLeadId);
router.post('/:orderId/vendor',protect, addVendorToOrder);
router.post('/:orderId/notes', addNoteToOrder);
router.get('/getprocurementorders',protect,getProcurementOrders);

router.get('/getallvendors',getAllVendors);

router.post('/sendpurchaseorder/:id',protect,sendPurchaseorder);

router.patch('/update-status/:id',protect,changeOrderStatus)

export default router;