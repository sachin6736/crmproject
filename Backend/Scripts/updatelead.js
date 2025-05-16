import mongoose from "mongoose";
import Lead from "../models/lead.js"; // Adjust path as needed

mongoose
  .connect(
    "mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest"
  )
  .then(async () => {
    const result = await Lead.updateMany(
      {
        warranty: { $exists: false },
      },
      {
        $set: {
          warranty: 0,
        },
      }
    );
    console.log(
      `✅ Updated ${result.modifiedCount} leads with default warranty field.`
    );
    await mongoose.disconnect();
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB", err);
  });