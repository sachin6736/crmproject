import Lead from "../../models/lead.js";
import User from "../../models/user.js";
import RoundRobinState from "../../models/RoundRobinState.js";
import sendEmail from "../../sendEmail.js";
import { validationResult } from "express-validator";

const ADMIN_EMAIL = "sachinpradeepan27@gmail.com";

// creating leads
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
        partRequested,
        make,
        model,
        year,
        trim,
      } = req.body;
      console.log("requestbody", req.body);

      const salesTeam = await User.find({ role: "sales", isPaused: false });
      console.log("salesteam", salesTeam);
      if (salesTeam.length === 0) {
        return res.status(400).json({ message: "No sales team members found" });
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
      const nextIndex = (currentIndex + 1) % salesTeam.length;
      roundRobinState.currentIndex = nextIndex;
      await roundRobinState.save();
      // const emailContent = `
      //     <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;">
      //         <h2 style="color: #333;">New Quotation Request</h2>
      //         <p><strong>Name:</strong> ${clientName}</p>
      //         <p><strong>Phone:</strong> ${phoneNumber}</p>
      //         <p><strong>Email:</strong> ${email}</p>
      //         <p><strong>Zip Code:</strong> ${zip}</p>
      //         <p><strong>Part Requested:</strong> ${partRequested}</p>
      //         <p><strong>Make:</strong> ${make}</p>
      //         <p><strong>Model:</strong> ${model}</p>
      //         <p><strong>Year:</strong> ${year}</p>
      //         <p><strong>Trim:</strong> ${trim}</p>
      //         <hr>
      //         <p style="color: gray;">This is an automated email from your CRM system.</p>
      //     </div>
      // `;

      // // Send Email to Admin
      // await sendEmail(ADMIN_EMAIL, "New Quotation Request Received", emailContent);
      
      res.status(201).json({ message: "Lead created successfully and email sent" });  
    } catch (error) {
      console.log("An error occurred", error);
      res.status(500).json({ message: "Error creating lead" });
    }
  }
};

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
    });

    await newLead.save();

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

      // Send Email to Admin
      await sendEmail(ADMIN_EMAIL, "New Quotation Request Received", emailContent);

    res
      .status(201)
      .json({ message: "Lead created by salesperson successfully" });
  } catch (error) {
    console.log("An error occurred", error);
    res.status(500).json({ message: "Error creating lead by salesperson" });
  }
};

export const getleads = async (req, res, next) => {
  console.log("getlist controller working");
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const status = req.query.status || "";

  const query = {};
  // Search logic (on clientName, email, phoneNumber)
  if (search) {
    query.$or = [
      { clientName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
    ];
  }

  // Status filter logic
  if (status) {
    query.status = status;
  }

  try {
    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      leads,
      totalPages: Math.ceil(totalLeads / limit),
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Error while fetching leads.");
  }
}; ///getting total leads by admin

export const leadbyperson = async (req, res, next) => {
  console.log("getMyLeads controller working");

  const userId = req.user?.id;
  console.log("user", userId);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const status = req.query.status || "";

  const query = { salesPerson: userId };

  if (search) {
    query.$or = [
      { clientName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
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
      .sort({ createdAt: -1 });

    res.status(200).json({
      leads,
      totalPages: Math.ceil(totalLeads / limit),
      currentPage: page,
    });
  } catch (error) {
    console.log("Error fetching user-specific leads:", error);
    res.status(500).json({ message: "Error while fetching your leads." });
  }
}; //getting individual leads by each person

//editing lead status
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
    lead.status = status;

    console.log("testing", req.user);
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

export const getLeadById = async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log("id of single:", id);

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    lead.notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: "Error fetching lead", error });
  }
};

////===================================================================
//notes
export const createnotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    console.log("req.body", req.body);
    console.log("Updating notes for Lead ID:", id);
    const newNote = {
      text,
      createdAt: new Date(),
    };
    console.log("newnote", newNote);
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { $push: { notes: newNote } },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.status(200).json({
      message: "Note added successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error updating notes" });
  }
}; ///creating notes

export const deletenotes = async (req, res, next) => {
  try {
    const { id, noteid } = req.params;
    console.log("params", req.params);
    console.log("leadid", id);
    console.log("noteid", noteid);

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { $pull: { notes: { _id: noteid } } }, // Remove note
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
    const { selectedDate } = req.body;
    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (req.method === "POST") {
      if (!lead.importantDates.includes(selectedDate)) {
        lead.importantDates.push(selectedDate);
      }
    }

    await lead.save();
    res.status(200).json({ message: "Date updated successfully", lead });
  } catch (error) {
    console.error("Error updating date:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}; ///adding date

export const deleteDate = async (req, res, next) => {
  console.log("Deleting date...");
  try {
    const { id, date } = req.params;
    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.importantDates = lead.importantDates.filter((d) => d !== date);
    await lead.save();

    res.status(200).json({ message: "Date removed successfully", lead });
  } catch (error) {
    console.error("Error deleting date:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}; ///removing date
