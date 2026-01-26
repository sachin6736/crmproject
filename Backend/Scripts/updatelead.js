import mongoose from "mongoose";
import Litigation from "../models/Litigation.js"; // adjust path

mongoose
  .connect(
    "mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(async () => {
    console.log("Connected to MongoDB");

    try {
      // Find documents where history field is missing or null
      const docsToUpdate = await Litigation.find({
        $or: [
          { history: { $exists: false } },
          { history: null }
        ]
      });

      console.log(`Found ${docsToUpdate.length} Litigation docs to migrate`);

      if (docsToUpdate.length === 0) {
        console.log("All documents already have history field → nothing to do");
        return;
      }

      // Add history: [] to each
      const promises = docsToUpdate.map(doc =>
        Litigation.updateOne(
          { _id: doc._id },
          { $set: { history: [] } }
        )
      );

      const results = await Promise.all(promises);
      const modified = results.reduce((sum, r) => sum + (r.modifiedCount || 0), 0);

      console.log(`Successfully added history: [] to ${modified} documents`);
    } catch (err) {
      console.error("Migration failed:", err);
    } finally {
      await mongoose.disconnect();
      console.log("Disconnected");
    }
  })
  .catch(err => console.error("Connection failed:", err));