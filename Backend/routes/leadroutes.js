import express, { Router } from "express";
import { createleads , getleads,editstatus,getLeadById,createnotes,deletenotes, adddate,deleteDate, leadbyperson ,createLeadBySalesperson,editlead, updatecost, leadquatation, changeowner} from "../controllers/leadcontrollers.js";
import {protect} from '../middleware/authmiddleware.js'
import { validateLead } from "../middleware/leadValidation.js";
import { validationResult } from "express-validator";


const router = express.Router();

router.post('/createlead',validateLead,createleads)//creatingleads;
router.post('/createnewlead',protect,validateLead,createLeadBySalesperson)//creating lead through app
router.get('/getleads',protect,getleads)//gettinng all leads list for the admin;
router.get('/getleadbyperson',protect,leadbyperson)//getting leads by person for saleperson
router.put('/editstatus/:id',protect,editstatus)//editing status;
router.get('/getleadbyid/:id',getLeadById)//get leadbyid by clientid;
router.put('/editlead/:id',protect,editlead)//editing lead details;
router.post('/updatecost/:id',protect,updatecost)//updatecost;
router.post('/leadquatation/:id',leadquatation)//
router.post('/reassign/:id',protect,changeowner)

router.put('/updateNotes/:id',protect,createnotes)//creating notes
router.delete('/deleteNotes/:id/:noteid',deletenotes)

router.post('/updateDates/:id',protect,adddate)//adddates
router.delete("/updateDates/:id/:date",protect, deleteDate);


export default router;