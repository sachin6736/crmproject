import User from '../models/user.js';
import Lead from "../models/lead.js";
import bcrypt from 'bcrypt';
import Notification from '../models/notificationSchema.js';
import { io } from '../socket.js'

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

export const reassign = async (req, res, next) => {
  console.log("Reassigning leads");
  const { id } = req.params;

  try {
    // Restrict to admins only
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Find the old salesperson
    const oldSalesPerson = await User.findById(id);
    if (!oldSalesPerson) {
      return res.status(404).json({ message: "Salesperson not found." });
    }

    // Find active salespersons
    const salespersons = await User.find({
      role: "sales",
      _id: { $ne: id },
      isPaused: false,
      status: "Available",
    });

    if (salespersons.length === 0) {
      return res.status(400).json({ message: "No other active salespersons available for reassignment." });
    }

    // Find leads assigned to the target salesperson
    const leads = await Lead.find({ salesPerson: id });
    if (leads.length === 0) {
      return res.status(200).json({ message: "No leads to reassign." });
    }

    // Track salespersons receiving leads
    const assignedSalesPersons = new Set();
    const updatedLeads = [];
    let index = 0;

    // Reassign leads
    for (const lead of leads) {
      const newSalesPerson = salespersons[index % salespersons.length];
      lead.salesPerson = newSalesPerson._id;
      assignedSalesPersons.add(newSalesPerson._id.toString());
      updatedLeads.push(lead.save());
      index++;
    }

    // Save all lead updates
    await Promise.all(updatedLeads);

    // Create notifications for new salespersons
    const salesNotifications = Array.from(assignedSalesPersons).map(salesPersonId => ({
      recipient: salesPersonId,
      message: "You have been transferred new leads. Please review your lead list.",
      type: 'lead_reassign',
      isRead: false,
      createdAt: new Date(),
    }));

    // Create notifications for admins
    const admins = await User.find({ role: 'admin' });
    const adminNotifications = admins.map(admin => ({
      recipient: admin._id,
      message: `Leads have been successfully transferred from ${oldSalesPerson.name} to other team members.`,
      type: 'lead_reassign',
      isRead: false,
      createdAt: new Date(),
    }));

    // Save notifications
    const savedSalesNotifications = await Notification.insertMany(salesNotifications);
    const savedAdminNotifications = await Notification.insertMany(adminNotifications);

    // Emit notifications to new salespersons
    savedSalesNotifications.forEach(notification => {
      io.to(notification.recipient.toString()).emit('newNotification', {
        _id: notification._id.toString(),
        recipient: notification.recipient,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt.toISOString(),
        isRead: notification.isRead,
      });
    });

    // Emit notifications to admins
    savedAdminNotifications.forEach(notification => {
      io.to(notification.recipient.toString()).emit('newNotification', {
        _id: notification._id.toString(),
        recipient: notification.recipient,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt.toISOString(),
        isRead: notification.isRead,
      });
    });

    res.status(200).json({ message: `Reassigned ${leads.length} leads to other salespersons.` });
  } catch (error) {
    console.error("Error reassigning leads:", error);
    res.status(500).json({ message: "Server error while reassigning leads." });
  }
};

export const getCurrentUser = async (req, res) => {
  console.log("working")
  try {
    const user = await User.findById(req.user.id).select('-password'); // Exclude sensitive fields
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.log('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};