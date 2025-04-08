import express, { Router } from "express";
import { createleads , getleads ,editstatus,getLeadById,createnotes,deletenotes} from "../controllers/leadcontrollers.js";

const router = express.Router();

router.post('/createlead',createleads)//creatingleads;
router.get('/getleads',getleads)//gettinng leads;
router.put('/updatelead/:id',editstatus)//editing status;
router.get('/getleadbyid/:id',getLeadById)//get leadbyid;
router.put('/updateNotes/:id',createnotes)//creatleads
router.delete('/deleteNotes/:id/:noteid',deletenotes)
export default router;