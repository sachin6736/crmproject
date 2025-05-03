import mongoose from "mongoose";
import Lead from "../models/lead.js"; // adjus

mongoose.connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest")
  .then(async () => {
    const result = await Lead.updateMany(
      {
        $or: [
          { partCost: { $exists: false } },
          { shippingCost: { $exists: false } },
          { grossProfit: { $exists: false } },
          { totalCost: { $exists: false } },
        ]
      },
      {
        $set: {
          partCost: 0,
          shippingCost: 0,
          grossProfit: 0,
          totalCost: 0,
        }
      }
    );
    console.log(`✅ Updated ${result.modifiedCount} leads with default cost fields.`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error connecting to MongoDB", err);
  });