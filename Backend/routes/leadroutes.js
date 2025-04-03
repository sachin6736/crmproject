import express, { Router } from "express";
import { createleads , getleads ,editstatus} from "../controllers/leadcontrollers.js";

const router = express.Router();

router.post('/createlead',createleads)//creatingleads;
router.get('/getleads',getleads)//gettinng leads;
router.put('/updatelead/:id',editstatus)
export default router;