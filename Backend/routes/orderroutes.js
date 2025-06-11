import express from "express";
import { createOrder, getAllOrders, getMyOrders,getCustomerOrders, orderbyid, checkOrderByLeadId , addVendorToOrder, addNoteToOrder,getAllVendors,sendPurchaseorder , getProcurementOrders,changeOrderStatus,addProcurementNote,updateOrderDetails,updateShipmentDetails,previewPurchaseOrder} from "../controllers/Order.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/create", protect, createOrder);//creatingorder
//=======================
router.get("/getallorders", getAllOrders);//getting all orders by admin
router.get("/getmyorders", protect, getMyOrders);//getting orders by sales teams
router.get("/getcustomerorders", protect, getCustomerOrders);//geting orders by customer realtions team
router.get('/getprocurementorders',protect,getProcurementOrders);//geting orders by procurement team
//=================
router.get("/orderbyid/:id",protect ,orderbyid);// getting single order by id
router.get("/checkorderbylead/:leadId", protect, checkOrderByLeadId);
router.post('/:orderId/vendor',protect, addVendorToOrder);//addingvendor details
router.post('/:orderId/notes', addNoteToOrder);//adding notes to order
router.post("/:orderId/procurementnotes", protect, addProcurementNote);//adding notes by procurement team
router.get('/getallvendors',getAllVendors);//showing vendor details
router.get('/preview-purchase-order/:id', previewPurchaseOrder);//
router.post('/sendpurchaseorder/:id',protect,sendPurchaseorder); //sent purchase order
router.patch('/update-status/:id',protect,changeOrderStatus);
router.patch("/update/:orderId", protect,updateOrderDetails); // editorder details in customer-relations
router.patch('/:orderId/shipment', protect,updateShipmentDetails);//edit shipment details

export default router;