import User from '../models/user.js';
import Lead from "../models/lead.js";
import bcrypt from 'bcrypt';
import Notification from '../models/notificationSchema.js';
import { io } from '../socket.js'

export const resetpassword = async (req, res, next) => {
  console.log("Reset password request received for user ID:", req.params.id);

  try {
    // Only admin can reset passwords
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { id } = req.params;
    const { newpassword } = req.body;

    if (!newpassword) {
      return res.status(400).json({ message: "New password is required." });
    }

    if (newpassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Save password in plain text (no hashing)
    user.password = newpassword;

    await user.save();

    console.log("Password reset successfully for user ID:", id);
    console.log("New password set to:", newpassword); // Log for admin/debug

    // Return success + new password (so admin knows what it is)
    res.status(200).json({
      message: "Password reset successfully.",
      userId: user._id,
      email: user.email,
      newPassword: newpassword,  // ← admin can copy this
      note: "Password is plain text and shown here for convenience."
    });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

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


export const rolechange = async (req, res, next) => {
  console.log("rolechange working");
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { newrole } = req.body;
    const allowedRoles = ["admin", "sales", "customer_relations", "procurement","viewer"];
    if (!newrole || !allowedRoles.includes(newrole)) {
      return res.status(400).json({ message: "Invalid role provided." });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.role === newrole) {
      return res.status(204).json({ message: "User is already this role." });
    }
    user.role = newrole;
    await user.save();
    console.log(`Role changed to ${newrole} for user ID: ${req.params.id}`);
    res.status(200).json({ message: "User role changed successfully." });
  } catch (error) {
    console.error("Error occurred when changing role:", error);
    res.status(500).json({ message: "Server error." });
  }
};

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



export const updateUserAccess = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  const userId = req.params.id;
  const { access } = req.body;
  if (typeof access !== "boolean") {
    return res.status(400).json({ message: "Access must be a boolean" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.Access = access;
    await user.save();
    console.log(`User ${userId} Access updated to ${access}`);
    return res.status(200).json({ message: `Access ${access ? "granted" : "revoked"}`, user: { _id: user._id, Access: user.Access } });
  } catch (error) {
    console.error(`Error updating access for user ${userId}:`, error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateEditCostAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const { editCostAccess } = req.body;

    if (typeof editCostAccess !== "boolean") {
      return res.status(400).json({ message: "Invalid input" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the requesting user has admin privileges (assumes req.user is set by authentication middleware)
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied, admin access required" });
    }

    user.Editcost = editCostAccess;
    await user.save();

    res.status(200).json({
      message: `Edit cost access ${editCostAccess ? "granted" : "revoked"} successfully`,
    });
  } catch (error) {
    console.error("Error updating edit cost access:", error);
    res.status(500).json({ message: "Server error" });
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