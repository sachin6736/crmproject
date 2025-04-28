import User from '../../models/user.js';
import Lead from "../../models/lead.js";
import bcrypt from 'bcrypt';

export const resetpassword = async(req,res,next)=>{
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
          }
        const {id} = req.params
        const {newpassword}= req.body;
        if (!newpassword) {
            return res.status(400).json({ message: "New password is required." });
          }
        const user = await User.findById(id)
        console.log("user",user)
        if(!user){
            return res.status(404).json({message: "user not found"})
        }
        console.log("new",newpassword)
        const hashedPassword = await bcrypt.hash(newpassword,10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
        console.log("Password reset error:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
} ///resetting password by admin

export const pauseandresume = async(req,res,next)=>{
    console.log("pauser and resume working")
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
          }
          const {status} = req.body;
          if(typeof status !== "boolean"){
            return res.status(400).json({message:"invalid status"})
          }
          const user = await User.findById(req.params.id);
          if (!user) {
            return res.status(404).json({ message: "User not found." });
          }
          if (user.isPaused === status){
            return res.status(204).json({ message: `User is already ${status ? "paused" : "resumed"}.` });
          }
          await User.findByIdAndUpdate(req.params.id, { isPaused: status });
          res.status(200).json({ message: `User ${status ? "paused" : "resumed"}` });
    } catch (error) {
        console.log("error occured when changing action",error)
        res.status(500).json({message:"server error"})
    }
}//pausing and resuming user


export const rolechange = async(req,res,next)=>{
  console.log("rolechange working")
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const {newrole} = req.body;
    const user = await User.findById(req.params.id);
          if (!user) {
            return res.status(404).json({ message: "User not found." });
          }
          if (user.role === newrole ){
            return res.status(204).json({ message: `User is  already this role}.` });
          }
          user.role = newrole;
          await user.save();
          res.status(200).json({ message: "user role changed" });      
  } catch (error) {
    console.log("error occured when changing action",error)
    res.status(500).json({message:"server error"})
  }
}

export const reassign = async (req,res,next)=>{
  console.log("reassign")
  const { id } = req.params;
  console.log("user",id)
  try {
    const salespersons = await User.find({ role: "sales", _id: { $ne: id }, isPaused: { $ne: true } });
    if (salespersons.length === 0) {
      return res.status(400).json({ message: "No other active salespersons available for reassignment." });
    }
    console.log("salespersons",salespersons)
    const leads = await Lead.find({ salesPerson: id });
    console.log("leads",leads)
    if (leads.length === 0) {
      return res.status(200).json({ message: "No leads to reassign." });
    }
    const updatedLeads = [];
    let index = 0;

    for (const lead of leads) {
      const newSalesPerson = salespersons[index % salespersons.length];
      lead.salesPerson = newSalesPerson._id;
      updatedLeads.push(lead.save());
      index++;
    }
    await Promise.all(updatedLeads);

    res.status(200).json({ message: `Reassigned ${leads.length} leads to other salespersons.` });
  } catch (error) {
    console.log("Error reassigning leads:", error);
    res.status(500).json({ message: "Server error while reassigning leads." });
  }
}
