import Lead from "../models/lead.js";
import User from "../models/user.js";


export const singleleads = async(req,res,next)=>{
    console.log("singlesales working")
    const userId = req.user?.id;
    console.log("user by singlesales",userId)
    try {
        if (req.user.role !== 'sales') {
          return res.status(403).json({ message: 'Access denied' });
        }
    
        const leads = await Lead.find({ salesPerson: req.user.id }).sort({ createdAt: -1 });
    
        res.json(leads);
      } catch (error) {
        console.error('Error fetching sales leads:', error);
        res.status(500).json({ message: 'Server error' });
      }
}
