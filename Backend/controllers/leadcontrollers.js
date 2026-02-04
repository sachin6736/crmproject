import Lead from "../models/lead.js";
import User from "../models/user.js";
import RoundRobinState from "../models/RoundRobinState.js";
import sendEmail from "../sendEmail.js";
import { validationResult } from "express-validator";
import Notification from '../models/notificationSchema.js';
import { io } from '../socket.js'

const ADMIN_EMAIL = "sachinpradeepan27@gmail.com";

//========================================= creating leads
export const createleads = async (req, res, next) => {
  console.log("Lead creation working");
  const errors = validationResult(req);
  console.log("errors:", errors);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  } else {
    try {
      const {
        clientName,
        phoneNumber,
        email,
        zip,
        partRequested = 'N/A', // Default if not provided
        make,
        model,
        year = 'N/A', // Default if not provided
        trim = 'N/A', // Default if not provided
      } = req.body;
      console.log("requestbody", req.body);

      const salesTeam = await User.find({
        role: "sales",
        isPaused: false,
      });
      console.log("salesteam", salesTeam);
      if (salesTeam.length === 0) {
        return res.status(400).json({ message: "No available sales team members found" });
      }

      let roundRobinState = await RoundRobinState.findOne();
      if (!roundRobinState) {
        roundRobinState = new RoundRobinState({ currentIndex: 0 });
        await roundRobinState.save();
      }

      if (roundRobinState.currentIndex >= salesTeam.length) {
        roundRobinState.currentIndex = 0;
      }
      console.log("index", roundRobinState);
      const currentIndex = roundRobinState.currentIndex % salesTeam.length;
      const salesPerson = salesTeam[currentIndex];

      console.log("salesperson", salesPerson);
      const newLead = new Lead({
        clientName,
        phoneNumber,
        email,
        zip,
        partRequested,
        make,
        model,
        year,
        trim,
        salesPerson: salesPerson._id,
      });
      await newLead.save();

      // Create notifications
      const salesNotification = new Notification({
        recipient: salesPerson._id,
        message: `New lead assigned: ${clientName} - ${partRequested}`,
        type: 'new_lead',
        lead: newLead._id,
      });
      await salesNotification.save();

      // Notify all admins
      const admins = await User.find({ role: 'admin' });
      const adminNotifications = admins.map(admin => ({
        recipient: admin._id,
        message: `New lead: ${clientName} - ${partRequested} to ${salesPerson.name}`,
        type: 'new_lead',
        lead: newLead._id,
      }));
      await Notification.insertMany(adminNotifications);

      // Emit socket events
      io.to(salesPerson._id.toString()).emit('newNotification', {
        _id: salesNotification._id,
        recipient: salesNotification.recipient,
        message: salesNotification.message,
        type: salesNotification.type,
        lead: { _id: salesNotification.lead.toString() },
        createdAt: salesNotification.createdAt.toISOString(),
        isRead: salesNotification.isRead,
      });

      const now = new Date();
      admins.forEach(admin => {
        io.to(admin._id.toString()).emit('newNotification', {
          recipient: admin._id,
          message: `New lead: ${clientName} - ${partRequested} to ${salesPerson.name}`,
          type: 'new_lead',
          lead: { _id: newLead._id.toString() },
          createdAt: now.toISOString(),
          isRead: false,
        });
      });

      const nextIndex = (currentIndex + 1) % salesTeam.length;
      roundRobinState.currentIndex = nextIndex;
      await roundRobinState.save();

      const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;">
              <h2 style="color: #333;">New Quotation Request</h2>
              <p><strong>Name:</strong> ${clientName}</p>
              <p><strong>Phone:</strong> ${phoneNumber}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Zip Code:</strong> ${zip}</p>
              <p><strong>Part Requested:</strong> ${partRequested}</p>
              <p><strong>Make:</strong> ${make}</p>
              <p><strong>Model:</strong> ${model}</p>
              <p><strong>Year:</strong> ${year}</p>
              <p><strong>Trim:</strong> ${trim}</p>
              <hr>
              <p style="color: gray;">This is an automated email from your CRM system.</p>
          </div>
      `;

      await sendEmail(process.env.ADMIN_EMAIL, "New Quotation Request Received", emailContent);
      res.status(201).json({ message: "Lead created successfully and notifications sent" });
    } catch (error) {
      console.log("An error occurred", error);
      res.status(500).json({ message: "Error creating lead" });
    }
  }
};

//================================================================= manual creation of leads
export const createLeadBySalesperson = async (req, res, next) => { 
  console.log("Salesperson creating a lead");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const {
      clientName,
      phoneNumber,
      email,
      zip,
      partRequested,
      make,
      model,
      year,
      trim,
    } = req.body;

    const salesPersonId = req.user.id;  

    const salesperson = await User.findById(salesPersonId);
    if (!salesperson) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    const newLead = new Lead({
      clientName,
      phoneNumber,
      email,
      zip,
      partRequested,
      make,
      model,
      year,
      trim,
      salesPerson: salesPersonId,
      createdBy: true,
    });
    await newLead.save();

    const salesNotification = new Notification({
      recipient: salesPersonId,
      message: `You created a new lead: ${clientName} - ${partRequested}`,
      type: 'new_lead',
      lead: newLead._id,
    });
    await salesNotification.save();

    const admins = await User.find({ role: 'admin' });
    const adminNotifications = admins.map(admin => ({
      recipient: admin._id,
      message: `New lead created by ${salesperson.name}: ${clientName} - ${partRequested}`,
      type: 'new_lead',
      lead: newLead._id,
    }));
    await Notification.insertMany(adminNotifications);

    io.to(salesPersonId.toString()).emit('newNotification', {
      _id: salesNotification._id,
      recipient: salesNotification.recipient,
      message: salesNotification.message,
      type: salesNotification.type,
      lead: { _id: salesNotification.lead.toString() },
      createdAt: salesNotification.createdAt.toISOString(),
      isRead: salesNotification.isRead,
    });

    const now = new Date();
    admins.forEach(admin => {
      io.to(admin._id.toString()).emit('newNotification', {
        recipient: admin._id,
        message: `New lead created by ${salesperson.name}: ${clientName} - ${partRequested}`,
        type: 'new_lead',
        lead: { _id: newLead._id.toString() },
        createdAt: now.toISOString(),
        isRead: false,
      });
    });

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;">
        <h2 style="color: #333;">New Quotation Request</h2>
        <p><strong>Name:</strong> ${clientName}</p>
        <p><strong>Phone:</strong> ${phoneNumber}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Zip Code:</strong> ${zip}</p>
        <p><strong>Part Requested:</strong> ${partRequested}</p>
        <p><strong>Make:</strong> ${make}</p>
        <p><strong>Model:</strong> ${model}</p>
        <p><strong>Year:</strong> ${year}</p>
        <p><strong>Trim:</strong> ${trim}</p>
        <hr>
        <p style="color: gray;">This is an automated email from your CRM system.</p>
      </div>
    `;

    await sendEmail(ADMIN_EMAIL, "New Quotation Request Received", emailContent);

    res.status(201).json({ message: "Lead created by salesperson successfully" });
  } catch (error) {
    console.log("An error occurred", error);
    res.status(500).json({ message: "Error creating lead by salesperson" });
  }
};

//==============================================================getting leads
export const getleads = async (req, res, next) => {
  console.log("getlist controller working");
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search?.trim() || "";
  const status = req.query.status || "";

  const query = {};

  if (search) {
    const isNumericSearch = !isNaN(search) && search !== "";
    query.$or = [
      { clientName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
      { partRequested: { $regex: search, $options: "i" } },
      ...(isNumericSearch ? [{ zip: search }] : []),
    ];
  }

  if (status) {
    query.status = status;
  }

  try {
    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("salesPerson", "name")
      .lean();
    console.log("leads", leads);
    res.status(200).json({
      leads,
      totalPages: Math.ceil(totalLeads / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "Error while fetching leads." });
  }
};

//===================================================getting leads by salesperson
export const leadbyperson = async (req, res, next) => {
  console.log("getMyLeads controller working");

  const userId = req.user?.id;
  console.log("user", userId);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search?.trim() || "";
  const status = req.query.status || "";

  // Remove the salesPerson filter to fetch all leads
  const query = {};

  if (search) {
    const isNumericSearch = !isNaN(search) && search !== "";
    query.$or = [
      { clientName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
      { partRequested: { $regex: search, $options: "i" } },
      ...(isNumericSearch ? [{ zip: search }] : []),
    ];
  }

  if (status) {
    query.status = status;
  }

  try {
    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('salesPerson', 'name email') // Populate salesPerson to access name
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    // Add isOwnLead flag to each lead
    const leadsWithFlag = leads.map(lead => ({
      ...lead,
      isOwnLead: lead.salesPerson?._id?.toString() === userId.toString(),
    }));

    res.status(200).json({
      leads: leadsWithFlag,
      totalPages: Math.ceil(totalLeads / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching user-specific leads:", error);
    res.status(500).json({ message: "Error while fetching leads." });
  }
};

//==============================================editing lead status

export const editstatus = async (req, res, next) => {
  console.log("editstatus working");
  try {
    const id = req.params.id;
    console.log("id of the lead:", id);
    const { status } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (lead.status === status) {
      return res.status(400).json({
        message: `Status is already set to ${status}.`,
      });
    }

    if (lead.status === "Ordered" && status !== "Ordered") {
      return res.status(400).json({
        message: "Cannot change status: Lead is already set to Ordered.",
      });
    }

    if (status === "Ordered") {
      if (
        !lead.partCost ||
        !lead.shippingCost ||
        !lead.grossProfit ||
        !lead.totalCost
      ) {
        return res.status(400).json({
          message:
            "Cannot set status to Ordered: Part Cost, Shipping Cost, Gross Profit, and Total Cost must be set.",
        });
      }
    }

    lead.status = status;

    const userIdentity = req?.user?.name || req?.user?.id || "Unknown User";
    lead.notes.push({
      text: `changed to '${status}' by ${userIdentity}`,
      addedBy: userIdentity,
      createdAt: new Date(),
    });

    await lead.save();
    return res.status(200).json({ message: "Lead status updated", lead });
  } catch (error) {
    console.log("Error updating lead status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//======================================leadsbyid
export const getLeadById = async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log("id of single:", id);

    const lead = await Lead.findById(id);
    console.log("Lead:", lead);
    
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    lead.notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: "Error fetching lead", error });
  }
};

//===================================================================

export const createnotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    // Log user details for debugging
    console.log('req.user:', req.user);
    const name = req.user?.name;
    console.log('name:', name);

    // Validate text
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ message: 'Text is required and must be a non-empty string' });
    }

    // Validate req.user and req.user.name
    if (!req.user || !req.user.name) {
      return res.status(401).json({ message: 'User not authenticated or name not provided' });
    }

    // Find lead
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Add note to lead with concatenated text including user's name
    const noteText = `${text.trim()} [${req.user.name}]`; // Concatenate text with user's name in brackets
    lead.notes.push({ 
      text: noteText, 
      createdAt: new Date() 
    });
    await lead.save();

    // Return the updated lead (add population if needed, similar to the order example)
    const updatedLead = await Lead.findById(id)
      // .populate('relevant fields if any'); // Uncomment and adjust as needed

    res.status(201).json({ message: 'Note added successfully', lead: updatedLead });
  } catch (error) {
    console.error('Error adding note to lead:', error);
    res.status(500).json({ message: 'Server error while adding note' });
  }
};

export const deletenotes = async (req, res, next) => {
  try {
    const { id, noteid } = req.params;
    console.log("params", req.params);
    console.log("leadid", id);
    console.log("noteid", noteid);

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { $pull: { notes: { _id: noteid } } },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ error: "Lead or note not found" });
    }

    res.json({ message: "Note deleted successfully", lead: updatedLead });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Error deleting note" });
  }
};

//==========================================================
//calendar section

export const adddate = async (req, res, next) => {
  console.log("Dates controller working");
  try {
    const id = req.params.id;
    const { selectedDate, note } = req.body;
    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const userIdentity = req?.user?.name || req?.user?.id || "Unknown User";

    if (req.method === "POST") {
      const dateExists = lead.importantDates.some(d => d.date === selectedDate);
      if (!dateExists) {
        lead.importantDates.push({ date: selectedDate, note: note || "" });
        lead.notes.push({
          text: `Added important date ${selectedDate}${note ? ` with note: "${note}"` : ""} by ${userIdentity}`,
          addedBy: userIdentity,
          createdAt: new Date(),
        });
      } else {
        return res.status(400).json({ message: "Date already exists" });
      }
    }

    await lead.save();
    res.status(200).json({ message: "Date and note updated successfully", lead });
  } catch (error) {
    console.error("Error updating date:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteDate = async (req, res, next) => {
  console.log("Deleting date...");
  try {
    const { id, date } = req.params;
    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const dateObj = lead.importantDates.find(d => d.date === date);
    const userIdentity = req?.user?.name || req?.user?.id || "Unknown User";

    lead.importantDates = lead.importantDates.filter(d => d.date !== date);
    lead.notes.push({
      text: `Removed important date ${date}${dateObj?.note ? ` with note: "${dateObj.note}"` : ""} by ${userIdentity}`,
      addedBy: userIdentity,
      createdAt: new Date(),
    });

    await lead.save();

    res.status(200).json({ message: "Date removed successfully", lead });
  } catch (error) {
    console.error("Error deleting date:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ... (other controllers remain unchanged)

export const editlead = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    const updatedFields = req.body;
    const user = req.user;

    const allowedFields = [
      "clientName",
      "phoneNumber",
      "email",
      "zip",
      "partRequested",
      "make",
      "model",
      "year",
      "trim",
    ];

    const filteredFields = {};
    allowedFields.forEach((field) => {
      if (updatedFields[field] !== undefined) {
        filteredFields[field] = updatedFields[field];
      }
    });

    const existingLead = await Lead.findById(leadId);
    if (!existingLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Check if there are any actual changes
    const hasChanges = Object.keys(filteredFields).some(
      (field) => filteredFields[field] !== (existingLead[field] || "")
    );

    if (!hasChanges) {
      return res.status(200).json(existingLead); // Return existing lead without updating
    }

    const changes = [];
    for (const field of allowedFields) {
      if (
        filteredFields[field] !== undefined &&
        filteredFields[field] !== (existingLead[field] || "")
      ) {
        changes.push(
          `${field} changed from "${existingLead[field] || "N/A"}" to "${filteredFields[field]}"`
        );
      }
    }

    let noteUpdate = {};
    if (changes.length > 0) {
      const noteText = `Lead updated by ${user.name || user.email || "Unknown User"}: ${changes.join("; ")}`;
      noteUpdate = {
        $push: {
          notes: {
            text: noteText,
            addedBy: user.name || user.email || "Unknown User",
            createdAt: new Date(),
          },
        },
      };
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { $set: filteredFields, ...noteUpdate },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json(updatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatecost = async (req, res, next) => {
  const { id } = req.params;
  const { partCost, shippingCost, grossProfit, warranty, totalCost } = req.body;

  try {
    // Check if user has Editcost permission
    const user = await User.findById(req.user.id, "Editcost");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.Editcost) {
      return res.status(403).json({ message: "Unauthorized: Cost editing permission required" });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Store original values for comparison
    const originalValues = {
      partCost: lead.partCost || 0,
      shippingCost: lead.shippingCost || 0,
      grossProfit: lead.grossProfit || 0,
      warranty: lead.warranty || "0 months",
      totalCost: lead.totalCost || 0,
    };

    // Check if there are any changes
    const hasChanges =
      (partCost !== undefined && parseFloat(partCost) !== originalValues.partCost) ||
      (shippingCost !== undefined && parseFloat(shippingCost) !== originalValues.shippingCost) ||
      (grossProfit !== undefined && parseFloat(grossProfit) !== originalValues.grossProfit) ||
      (warranty !== undefined && warranty !== originalValues.warranty) ||
      (totalCost !== undefined && parseFloat(totalCost) !== originalValues.totalCost);

    if (!hasChanges) {
      return res.status(200).json(lead); // Return existing lead without updating
    }

    // Update fields only if provided
    const updates = {};
    if (partCost !== undefined) updates.partCost = parseFloat(partCost);
    if (shippingCost !== undefined) updates.shippingCost = parseFloat(shippingCost);
    if (grossProfit !== undefined) updates.grossProfit = parseFloat(grossProfit);
    if (warranty !== undefined) updates.warranty = warranty;
    if (totalCost !== undefined) updates.totalCost = parseFloat(totalCost);

    // Determine if this is an initial cost addition or an update
    const isInitialCostAddition =
      originalValues.partCost === 0 &&
      originalValues.shippingCost === 0 &&
      originalValues.grossProfit === 0 &&
      originalValues.warranty === "0 months" &&
      originalValues.totalCost === 0;

    // Generate note based on whether it's an addition or update
    const userIdentity = req?.user?.name || req?.user?.id || "Unknown User";
    let noteText;
    if (isInitialCostAddition) {
      // For initial cost addition, list all provided fields
      noteText = `Costs added by ${userIdentity}: `;
      const fields = [];
      if (partCost !== undefined) fields.push(`Part Cost: $${parseFloat(partCost).toFixed(2)}`);
      if (shippingCost !== undefined) fields.push(`Shipping Cost: $${parseFloat(shippingCost).toFixed(2)}`);
      if (grossProfit !== undefined) fields.push(`Gross Profit: $${parseFloat(grossProfit).toFixed(2)}`);
      if (warranty !== undefined) fields.push(`Warranty: ${warranty}`);
      if (totalCost !== undefined) fields.push(`Total Cost: $${parseFloat(totalCost).toFixed(2)}`);
      noteText += fields.join(", ");
    } else {
      // For updates, list only changed fields with old and new values
      noteText = `Costs updated by ${userIdentity}: `;
      const changedFields = [];
      if (partCost !== undefined && parseFloat(partCost) !== originalValues.partCost)
        changedFields.push(`Part Cost: $${originalValues.partCost.toFixed(2)} to $${parseFloat(partCost).toFixed(2)}`);
      if (shippingCost !== undefined && parseFloat(shippingCost) !== originalValues.shippingCost)
        changedFields.push(`Shipping Cost: $${originalValues.shippingCost.toFixed(2)} to $${parseFloat(shippingCost).toFixed(2)}`);
      if (grossProfit !== undefined && parseFloat(grossProfit) !== originalValues.grossProfit)
        changedFields.push(`Gross Profit: $${originalValues.grossProfit.toFixed(2)} to $${parseFloat(grossProfit).toFixed(2)}`);
      if (warranty !== undefined && warranty !== originalValues.warranty)
        changedFields.push(`Warranty: ${originalValues.warranty} to ${warranty}`);
      if (totalCost !== undefined && parseFloat(totalCost) !== originalValues.totalCost)
        changedFields.push(`Total Cost: $${originalValues.totalCost.toFixed(2)} to $${parseFloat(totalCost).toFixed(2)}`);
      noteText += changedFields.join(", ");
    }

    // Apply updates to lead
    Object.assign(lead, updates);

    // Add note to lead
    lead.notes.push({
      text: noteText,
      addedBy: userIdentity,
      createdAt: new Date(),
    });

    await lead.save();
    res.status(200).json(lead);
  } catch (error) {
    console.error("Error updating costs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const leadquatation = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the lead by ID
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Validate email presence
    if (!lead.email) {
      return res.status(400).json({ message: "Lead email is missing" });
    }

    // Validate total cost
    if (!lead.totalCost || lead.totalCost <= 0) {
      return res.status(400).json({ message: "Quotation cannot be sent without a valid total cost" });
    }

    // Get user information from req.user (assuming authentication middleware)
    const user = req?.user?.name || req?.user?.id || "Unknown User";

    // Generate email content
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e2e2; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center;">
        <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746598236/Picsart_24-04-02_10-36-01-714_xpnbgi.png" alt="First Used Autoparts Logo" style="max-width: 250px; margin-bottom: 24px;" />
      </div>
      
      <h2 style="color: #2a2a2a;">Welcome to First Used Autoparts!</h2>
      <p style="color: #555;">
        Dear ${lead.clientName},<br />
        Thank you for your inquiry. Below is your quotation for the requested part.    
      </p>
  
      <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Quotation Details</h3>
      <ul style="list-style: none; padding: 0; color: #333;">
        <li style="margin-bottom: 8px;"><strong>Part:</strong> ${lead.partRequested}</li>
        <li style="margin-bottom: 8px;"><strong>Make:</strong> ${lead.make}</li>
        <li style="margin-bottom: 8px;"><strong>Model:</strong> ${lead.model}</li>
        <li style="margin-bottom: 8px;"><strong>Year:</strong> ${lead.year}</li>
        <li style="margin-bottom: 8px;"><strong>Trim:</strong> ${lead.trim}</li>
        <li style="margin-bottom: 8px;"><strong>Estimated Cost (with shipping):</strong> $${lead.totalCost}</li>
      </ul> 
      <p style="color: #555;">
        To proceed or ask questions, reply to this email or call +1 888-282-7476.
      </p>
  
      <p style="color: #555;">Best regards,<br />
      <strong>First Used Autoparts Team</strong></p>
  
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #ddd;" />
  
      <div style="font-size: 14px; color: #888;">
        <p><strong>Address:</strong><br />
        330 N Brand Blvd, STE 700<br />
        Glendale, California 91203</p>
  
        <p><strong>Contact:</strong><br />
        +1 888-282-7476<br />
        <a href="mailto:contact@firstusedautoparts.com" style="color: #007BFF; text-decoration: none;">contact@firstusedautoparts.com</a></p>
      </div>
  
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://www.facebook.com/profile.php?id=61558228601060" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746599473/fb_n6h6ja.png" alt="Facebook" style="width: 32px; height: 32px;" />
        </a>
        <a href="https://www.linkedin.com/company/first-used-auto-parts/" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746599377/linkedin_v3pufc.png" alt="LinkedIn" style="width: 32px; height: 32px;" />
        </a>
        <a href="https://www.instagram.com/first_used_auto_parts/" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746598983/10462345_g4oluw.png" alt="Instagram" style="width: 32px; height: 32px;" />
        </a>
        <a href="https://twitter.com/parts54611" style="margin: 0 10px; display: inline-block;">
          <img src="https://res.cloudinary.com/dxv6yvhbj/image/upload/v1746599225/twitter_kivbi6.png" alt="X" style="width: 32px; height: 32px;" />
        </a>
      </div>
      
      <p style="text-align: center; margin-top: 10px;">
        <a href="https://www.facebook.com/profile.php?id=61558228601060" style="color: #007BFF; margin: 0 5px;">Facebook</a> |
        <a href="https://www.linkedin.com/company/first-used-auto-parts/" style="color: #007BFF; margin: 0 5px;">LinkedIn</a> |
        <a href="https://www.instagram.com/first_used_auto_parts/" style="color: #007BFF; margin: 0 5px;">Instagram</a> |
        <a href="https://twitter.com/parts54611" style="color: #007BFF; margin: 0 5px;">X</a>
      </p>
  
      <p style="text-align: center; font-size: 12px; color: #aaa; margin-top: 20px;">
        © ${new Date().getFullYear()} First Used Autoparts. All rights reserved.<br />
        <a href="https://www.firstusedautoparts.com/preferences?email=${encodeURIComponent(lead.email)}" style="color: #007BFF; text-decoration: none;">Manage email preferences</a>
      </p>
    </div>
    `;

    // Send the email
    await sendEmail(lead.email, `${lead.partRequested} Quotation`, htmlContent);

    // Add note to the lead's notes array
    const noteText = `Quotation sent by ${user} with cost $${lead.totalCost}`;
    lead.notes.push({
      text: noteText,
      createdAt: new Date(),
    });

    // Save the updated lead
    await lead.save();

    // Return success response
    res.status(200).json({ message: "Quotation sent successfully" });
  } catch (error) {
    console.error("Error sending quotation:", error);
    res.status(500).json({ message: "Failed to send quotation" });
  }
};

export const changeowner = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { id } = req.params;
    const { salesPersonId } = req.body;
    console.log("Lead ID:", id);
    console.log("Salesperson ID:", salesPersonId);

    if (!id || !salesPersonId) {
      return res.status(400).json({ message: "Lead ID and Salesperson ID are required." });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    const salesPerson = await User.findById(salesPersonId);
    if (!salesPerson) {
      return res.status(404).json({ message: "Salesperson not found." });
    }
    if (salesPerson.role !== "sales") {
      return res.status(400).json({ message: "Selected user is not a salesperson." });
    }
    if (salesPerson.isPaused) {
      return res.status(405).json({ message: "Cannot assign lead to a paused salesperson." });
    }
    if (salesPerson.status !== "Available") {
      return res.status(405).json({ message: "Cannot assign lead to a salesperson who is unavailable." });
    }
    if (lead.salesPerson && lead.salesPerson.toString() === salesPersonId) {
      return res.status(400).json({ message: "Lead is already assigned to this salesperson." });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    lead.salesPerson = salesPersonId;
    await lead.save();

    const salesNotification = new Notification({
      recipient: salesPersonId,
      message: `Lead  ${lead.clientName} has been assigned to you`,
      type: 'lead_reassign',
      lead: lead._id,
    });
    await salesNotification.save();

    const admins = await User.find({ role: 'admin' });
    const adminNotifications = admins.map(adminUser => ({
      recipient: adminUser._id,
      message: `Lead for ${lead.clientName} reassigned to ${salesPerson.name} by ${admin.name}`,
      type: 'lead_reassign',
      lead: lead._id,
    }));
    await Notification.insertMany(adminNotifications);

    io.to(salesPersonId.toString()).emit('newNotification', {
      _id: salesNotification._id,
      recipient: salesNotification.recipient,
      message: salesNotification.message,
      type: salesNotification.type,
      lead: { _id: salesNotification.lead.toString() },
      createdAt: salesNotification.createdAt.toISOString(),
      isRead: salesNotification.isRead,
    });

    const now = new Date();
    admins.forEach(adminUser => {
      io.to(adminUser._id.toString()).emit('newNotification', {
        recipient: adminUser._id,
        message: `Lead for ${lead.clientName} reassigned to ${salesPerson.name} by ${admin.name}`,
        type: 'lead_reassign',
        lead: { _id: lead._id.toString() },
        createdAt: now.toISOString(),
        isRead: false,
      });
    });

    res.status(200).json({ message: "Lead reassigned successfully" });
  } catch (error) {
    console.error("Error reassigning lead:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// leadcontrollers.js
export const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    if (lead.paymentDetails?.confirmed) {
      return res.status(400).json({ message: "Payment already confirmed" });
    }

    lead.paymentDetails = {
      confirmed: true,
      paymentDate: new Date(),
      amount: parseFloat(amount) || lead.totalCost || 0,
    };

    const userIdentity = req.user?.name || req.user?.id || "System";
    lead.notes.push({
      text: `Payment confirmed for $${lead.paymentDetails.amount.toFixed(2)} by ${userIdentity}`,
      addedBy: userIdentity,
      createdAt: new Date(),
    });

    await lead.save();

    res.status(200).json(lead);
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// ... getConfirmedPaymentLeads

export const getConfirmedPaymentLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";

    const query = {
      "paymentDetails.confirmed": true,
    };

    // Search filter (name, email, phone)
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const totalLeads = await Lead.countDocuments(query);

    const leads = await Lead.find(query)
      .select(
        "clientName phoneNumber email paymentDetails partRequested make model year totalCost notes createdAt"
      )
      .sort({ "paymentDetails.paymentDate": -1 }) // newest payments first
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      confirmedLeads: leads,
      totalPages: Math.ceil(totalLeads / limit),
      currentPage: page,
      total: totalLeads,
    });
  } catch (error) {
    console.error("Error fetching confirmed payment leads:", error);
    res.status(500).json({ message: "Server error while fetching payment history" });
  }
};