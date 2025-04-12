import express from "express";
import { signup ,login} from "../controllers/Authcontrollers.js";

const router = express.Router();

router.post('/signup',signup);//sihnup route
router.post('/login',login);//login route

export default router;