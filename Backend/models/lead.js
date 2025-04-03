import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    zip: { type: String, required: true },
    partRequested: { type: String, required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: String, required: true },
    trim: { type: String, required: true },
    status: {
      type: String,
      enum: ["Lead", "Contacted", "Nurturing", "Qualified", "Not Qualified"], 
      default: "Lead",
    },
    notes: [
      {
        text: String,
        addedBy: String, // Salesperson's name or ID
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  });

  const Lead = mongoose.model("Lead",leadSchema);
  export default Lead;