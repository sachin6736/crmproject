import express, { Router } from "express";
import { createleads , getleads} from "../controllers/leadcontrollers.js";

const router = express.Router();

router.post('/createlead',createleads)//creatingleads;
router.get('/getleads',getleads)//gettinng leads
export default router;