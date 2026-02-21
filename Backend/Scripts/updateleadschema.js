// scripts/migrate-remove-paymentDetails-from-Leads.js

import mongoose from "mongoose";
import Lead from "../models/lead.js"; // Adjust path if needed
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    try {
      // 1. Find how many documents have paymentDetails
      const countWithField = await Lead.countDocuments({
        paymentDetails: { $exists: true },
      });

      console.log(`Found ${countWithField} Lead documents that have 'paymentDetails'`);

      if (countWithField === 0) {
        console.log("No documents contain 'paymentDetails' → nothing to remove");
        return;
      }

      // 2. Remove (unset) paymentDetails from all matching documents
      const result = await Lead.updateMany(
        { paymentDetails: { $exists: true } },
        { $unset: { paymentDetails: "" } }
      );

      console.log(`Successfully removed 'paymentDetails' from ${result.modifiedCount} documents`);

      // 3. Optional: Verify a few documents no longer have the field
      const samples = await Lead.find(
        {},
        { clientName: 1, email: 1, paymentDetails: 1, _id: 0 }
      )
        .limit(5)
        .lean();

      console.log("\nSample Lead documents after migration (paymentDetails should be missing):");
      samples.forEach((lead, index) => {
        console.log(`Lead ${index + 1}:`);
        console.log(`  Name: ${lead.clientName || "N/A"}`);
        console.log(`  Email: ${lead.email || "N/A"}`);
        console.log("  paymentDetails:", lead.paymentDetails || "— (removed)");
        console.log("  ────────────────────────");
      });

      console.log("\nMigration (remove paymentDetails) completed successfully ✅");
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