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


export const changestatus= async(req,res,next)=>{
  try {
      const {id} = req.params;
      const {status} = req.body
      const validstatus = ["Available", "OnBreak", "Lunch", "Meeting", "LoggedOut"]
      if (!validstatus.includes(status)) {
          return res.status(400).json({ message: "Invalid status value." });
        }
        const user = await User.findByIdAndUpdate(
          id,
          { status },
          { new: true }
        );
        if (!user) {
          return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({ message: "Status updated successfully.", user });  
  } catch (error) {
      console.log('error in changing status',error)
      res.status(500).json({ message: "Server error."});
  }
}