import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { litigation, updateOrderStatus,createLitigation, updateLitigation, getLitigation,sendRMAForm,addProcurement, updateProcurement ,resolveLitigation} from "../controllers/litireplace.js";

const router = express.Router();

router.get("/getLitigation", protect, litigation);//getting list of litigationoerders
router.patch("/updateStatus/:orderId", protect, updateOrderStatus);//changing order status to replacement
router.post('/litigation', createLitigation);//creating litigation form
router.patch('/update-litigation/:orderId',protect ,updateLitigation);//updating litigation form
router.get('/litigation/:orderId', getLitigation);//getting existing litigation form
router.post('/send-rma/:id',protect, sendRMAForm);//senting rma through mail
router.post('/add-procurement/:id', addProcurement);
router.patch('/update-procurement/:id', updateProcurement);
router.patch("/resolve-litigation/:orderId", protect ,resolveLitigation);
export default router;