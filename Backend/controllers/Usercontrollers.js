import User from '../models/user.js';
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
