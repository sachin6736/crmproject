import Lead from "../models/lead.js";
import sendEmail from "../sendEmail.js";

const ADMIN_EMAIL = "sachinpradeepan27@gmail.com"; 

// creating leads
export const createleads = async (req,res,next)=>{
    console.log("lead creation working");
    const {clientName,phoneNumber,email,zip,partRequested,make,model,year,trim,} = req.body;
    if(!clientName||!phoneNumber||!email||!zip||!partRequested||!make||!model||!year||!trim){
        res.status(401).json('all fields are necessary')
    }else{
        const newLead = new Lead({
            clientName: clientName,
            phoneNumber: phoneNumber,
            email: email,
            zip: zip,
            partRequested: partRequested,
            make: make,
            model: model,
            year: year,
            trim: trim,
          });      
          try {
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
          res.status(201).json({ message: "Lead created successfully and email sent" });
          } catch (error) {
            console.log("an error occured",error)
          }
    }         
}

//getting leads
export const getleads = async(req,res,next)=>{
  console.log("getlist controller working")
  try {
    const leads = await Lead.find();
    res.status(200).json(leads)
  } catch (error) {
    console.log(error) 
    res.status(500).json('error while fetching leads.')
  }
}

//editing lead status
export const editstatus = async(req,res,next)=>{
  console.log("editstatus working")
  try {
    const id = req.params.id;
    console.log("id of the lead:",id);
    const {status}= req.body
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }lead.status = status;
     await lead.save();
     return res.status(200).json({ message: "Lead status updated", lead });
  } catch (error) {
    console.error("Error updating lead status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const getLeadById = async (req, res ,next) => {
  try {
    const id = req.params.id
    console.log("id of single:",id);
    
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: "Error fetching lead", error });
  }
};

export const createnotes = async(req,res,next)=>{
  try {
    const { id } = req.params; // Get lead ID from params
    const { text } = req.body;
    console.log("req.body",req.body)
    console.log("Updating notes for Lead ID:", id);

    // Create new note object without addedBy
    const newNote = {
      text,
      createdAt: new Date(),
    };
    console.log("newnote",newNote)

    // Update the lead by pushing a new note into the notes array
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { $push: { notes: newNote } }, // Push new note object to the array
      { new: true } // Return the updated document
    );

    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.status(200).json({
      message: "Note added successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Error updating notes" });
  }
}