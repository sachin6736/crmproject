import express, { Router } from "express";
import { createleads , getleads ,editstatus,getLeadById} from "../controllers/leadcontrollers.js";

const router = express.Router();

router.post('/createlead',createleads)//creatingleads;
router.get('/getleads',getleads)//gettinng leads;
router.put('/updatelead/:id',editstatus)//editing status;
router.get('/getleadbyid/:id',getLeadById)//get leadbyid;

export default router;