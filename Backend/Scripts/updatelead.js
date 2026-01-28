// scripts/migrate-litigation-add-notes.js

import mongoose from "mongoose";
import Litigation from "../models/Litigation.js"; // adjust path
import dotenv from "dotenv";

dotenv.config();

mongoose
  .connect(
    process.env.MONGO_URI ||
    "mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    try {
      // Find documents missing litigationNotes
      const docsToUpdate = await Litigation.find({
        litigationNotes: { $exists: false }
      }).select("orderId createdAt"); // no need for litigationNotes here yet

      const count = docsToUpdate.length;
      console.log(`Found ${count} Litigation documents missing 'litigationNotes'`);

      if (count === 0) {
        console.log("All documents already have litigationNotes → nothing to do");
        return;
      }

      // Update in bulk
      const bulkOps = docsToUpdate.map(doc => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { litigationNotes: [] } }
        }
      }));

      const result = await Litigation.bulkWrite(bulkOps);
      console.log(`Successfully added litigationNotes: [] to ${result.modifiedCount} documents`);

      // Verify: now include litigationNotes in the sample query
      const samples = await Litigation.find(
        {}, 
        { orderId: 1, litigationNotes: 1, _id: 0 } // ← added litigationNotes here
      ).limit(5);

      console.log("\nSample after migration:");
      samples.forEach(s => {
        console.log(`Order ${s.orderId}: litigationNotes length = ${s.litigationNotes?.length || 0}`);
      });

      console.log("\nMigration completed successfully ✅");
    } catch (err) {
      console.error("❌ Migration failed:", err);
    } finally {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    }
  })
  .catch(err => {
    console.error("❌ Connection failed:", err);
  });