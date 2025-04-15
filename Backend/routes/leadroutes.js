import express, { Router } from "express";
import { createleads , getleads,editstatus,getLeadById,createnotes,deletenotes, adddate,deleteDate, leadbyperson} from "../controllers/leadcontrollers.js";
import {protect} from '../middleware/authmiddleware.js'

const router = express.Router();

router.post('/createlead',createleads)//creatingleads;
router.get('/getleads',protect,getleads)//gettinng all leads list for the admin;
router.get('/getleadbyperson',protect,leadbyperson)//getting leads by person for saleperson
router.put('/updatelead/:id',editstatus)//editing status;
router.get('/getleadbyid/:id',getLeadById)//get leadbyid by clientid;

router.put('/updateNotes/:id',createnotes)//creating notes
router.delete('/deleteNotes/:id/:noteid',deletenotes)

router.post('/updateDates/:id',adddate)//adddates
router.delete("/updateDates/:id/:date", deleteDate);


export default router;