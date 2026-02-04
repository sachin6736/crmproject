// scripts/migrate-add-paymentDetails-to-Leads.js

import mongoose from "mongoose";
import Lead from "../models/lead.js"; // ← Make sure this path is correct
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
      // 1. Find all Lead documents missing paymentDetails
      const docsToUpdate = await Lead.find({
        paymentDetails: { $exists: false },
      }).select("clientName email createdAt"); // lightweight fields for logging

      const count = docsToUpdate.length;
      console.log(`Found ${count} Lead documents missing 'paymentDetails'`);

      if (count === 0) {
        console.log("All Lead documents already have paymentDetails → nothing to do");
        return;
      }

      // 2. Prepare bulk operations
      const bulkOps = docsToUpdate.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              paymentDetails: {
                confirmed: false,
                paymentDate: null,
                amount: 0,
              },
            },
          },
          upsert: false, // safety: don't create new documents
        },
      }));

      // 3. Execute bulk update
      const result = await Lead.bulkWrite(bulkOps, { ordered: false });

      console.log(
        `Successfully added paymentDetails to ${result.modifiedCount} Lead documents`
      );

      // 4. Optional: Show a few sample documents after update (for verification)
      const samples = await Lead.find(
        {},
        { clientName: 1, email: 1, paymentDetails: 1, _id: 0 }
      )
        .limit(5)
        .lean();

      console.log("\nSample Lead documents after migration:");
      samples.forEach((lead, index) => {
        console.log(`Lead ${index + 1}:`);
        console.log(`  Name: ${lead.clientName || "N/A"}`);
        console.log(`  Email: ${lead.email || "N/A"}`);
        console.log("  paymentDetails:", lead.paymentDetails);
        console.log("  ────────────────────────");
      });

      console.log("\nMigration completed successfully ✅");
    } catch (err) {
      console.error("❌ Migration failed:", err);
      console.error(err.stack);
    } finally {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });