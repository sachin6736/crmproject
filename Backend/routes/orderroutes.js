import express from "express";
import { createOrder, getAllOrders, getMyOrders,getCustomerOrders,sendShipmentDetails,cancelVendor, orderbyid, checkOrderByLeadId , addVendorToOrder, addNoteToOrder,sendPurchaseorder , getProcurementOrders,addProcurementNote,updateOrderDetails,updateShipmentDetails,previewPurchaseOrder, createVendorSimple , getVendorSimpleList, updateVendorDetails, updateVendorPOStatus,confirmVendorPayment,markPicturesReceived,markPicturesSent,markShipmentDelivered,getAllCancelledVendors,addNoteToCancelledVendor,setOrderToLitigation,updateCancelledVendorPaymentStatus,getAllPaidVendors,addNoteToPaidVendor,getPaidVendorHistory,updateCustomerPaymentStatus,getConfirmedPaymentCustomers } from "../controllers/Order.js";
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
router.post('/:orderId/notes',protect, addNoteToOrder);//adding notes to order
router.post("/:orderId/procurementnotes", protect, addProcurementNote);//adding notes by procurement team
//router.get('/getallvendors',getAllVendors);//showing vendor details
router.get('/vendor-simple', protect, getVendorSimpleList); //vendor details list
router.get('/previewpurchaseorder/:id', previewPurchaseOrder);//
router.post('/sendpurchaseorder/:id',protect,sendPurchaseorder); //sent purchase order
router.post('/orders/:id/send-shipment-details',protect, sendShipmentDetails);
router.patch("/update/:orderId", protect,updateOrderDetails); // editorder details in customer-relations
router.put('/updateShipment/:orderId', protect,updateShipmentDetails);//edit shipment details
router.patch("/order/:orderId/vendor/:vendorId/pictures-received",protect,markPicturesReceived);//marking picture recived from yard
router.patch("/order/:orderId/vendor/:vendorId/pictures-sent",protect,markPicturesSent);//markingpictures sent to customer
router.patch("/orders/:orderId/shipment-delivered", protect, markShipmentDelivered);//marking shipment deliverd
router.post("/cancel-vendor",protect,cancelVendor);//cancel the vendor after payment
router.get('/cancelledvendorlist',protect,getAllCancelledVendors);  
router.post('/cancelledvendor/:vendorId/notes', protect, addNoteToCancelledVendor);
router.patch('/litigation/:orderId',protect,setOrderToLitigation);
router.patch('/cancelledvendor/:vendorId/paymentStatus', protect, updateCancelledVendorPaymentStatus); // New route for payment status update
router.get('/paidvendorlist', protect, getAllPaidVendors);
router.post('/paidvendor/:vendorId/notes', protect, addNoteToPaidVendor);
// routes/orderRoutes.js
router.get('/paidvendorhistory', protect, getPaidVendorHistory);

router.patch('/:id/customer-payment-status',protect,updateCustomerPaymentStatus);
router.get("/confirmed-payment-customers", protect,getConfirmedPaymentCustomers);


export default router;