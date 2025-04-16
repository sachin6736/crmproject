import express from "express";
import { signup ,login,logout} from "../controllers/Authcontrollers.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post('/signup',signup);//sihnup route
router.post('/login',login);//login route
router.post('/logout',logout)

router.get('/check', protect, (req, res) => {
    res.status(200).json({ user: req.user });
  });

export default router;