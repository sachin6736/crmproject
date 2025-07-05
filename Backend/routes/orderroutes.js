import express from "express";
import { createOrder, getAllOrders, getMyOrders,getCustomerOrders,sendShipmentDetails, orderbyid, checkOrderByLeadId , addVendorToOrder, addNoteToOrder,sendPurchaseorder , getProcurementOrders,addProcurementNote,updateOrderDetails,updateShipmentDetails,previewPurchaseOrder, createVendorSimple , getVendorSimpleList, updateVendorDetails, updateVendorPOStatus,confirmVendorPayment,markPicturesReceived,markPicturesSent} from "../controllers/Order.js";
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
router.post('/vendor-simple', protect, createVendorSimple); //creating single vendor in the database
router.post('/order/:orderId/vendor', protect, addVendorToOrder);//addingvendor details to order
router.patch('/order/:orderId/vendor/:vendorId/status', protect, updateVendorPOStatus);//update po status of vendor
router.patch('/order/:orderId/vendor/:vendorId', protect, updateVendorDetails); // update vendor
router.patch("/order/:orderId/vendor/:vendorId/confirm-payment",protect, confirmVendorPayment);// confirmation
router.post('/:orderId/notes', addNoteToOrder);//adding notes to order
router.post("/:orderId/procurementnotes", protect, addProcurementNote);//adding notes by procurement team
//router.get('/getallvendors',getAllVendors);//showing vendor details
router.get('/vendor-simple', protect, getVendorSimpleList); //vendor details list
router.get('/previewpurchaseorder/:id', previewPurchaseOrder);//
router.post('/sendpurchaseorder/:id',protect,sendPurchaseorder); //sent purchase order
router.post('/orders/:id/send-shipment-details',protect, sendShipmentDetails);
router.patch("/update/:orderId", protect,updateOrderDetails); // editorder details in customer-relations
router.put('/updateShipment/:orderId', protect,updateShipmentDetails);//edit shipment details
router.patch("/order/:orderId/vendor/:vendorId/pictures-received",protect,markPicturesReceived);
router.patch("/order/:orderId/vendor/:vendorId/pictures-sent",protect,markPicturesSent);

export default router;