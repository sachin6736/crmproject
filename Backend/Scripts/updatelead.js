import mongoose from "mongoose";
import Lead from "../models/lead.js"; // Adjust path to your Lead model

mongoose
  .connect(
    "mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    try {
      // Find all leads where importantDates contains strings (old schema)
      const leads = await Lead.find({
        importantDates: { $elemMatch: { $type: "string" } },
      });

      console.log(`Found ${leads.length} leads to update`);

      // Update each lead
      const updatePromises = leads.map(async (lead) => {
        // Convert array of strings to array of objects
        const updatedDates = lead.importantDates.map((date) => ({
          date: date,
          note: "", // Default to empty string for notes
        }));

        // Update the lead with the new importantDates structure
        return Lead.updateOne(
          { _id: lead._id },
          { $set: { importantDates: updatedDates } }
        );
      });

      // Execute all updates
      const results = await Promise.all(updatePromises);
      const modifiedCount = results.reduce(
        (sum, result) => sum + (result.modifiedCount || 0),
        0
      );

      console.log(
        `✅ Updated ${modifiedCount} leads with new importantDates structure`
      );
    } catch (error) {
      console.error("❌ Error updating leads:", error);
    } finally {
      await mongoose.disconnect();
      console.log("✅ Disconnected from MongoDB");
    }
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
  });