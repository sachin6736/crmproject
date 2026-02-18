// scripts/migrate-replacement-shipping-null-to-object.js

import mongoose from "mongoose";
import ReplacementOrder from "../models/ReplacementOrder.js"; // ← adjust path if needed
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    try {
      console.log("Starting migration: Converting shipping: null → shipping: {}");

      // Step 1: Count how many documents need fixing
      const countToFix = await ReplacementOrder.countDocuments({
        shipping: null,
      });

      console.log(`\nDocuments with shipping: null → ${countToFix}`);

      if (countToFix === 0) {
        console.log("→ No documents need migration. Already clean.");
        return;
      }

      // Step 2: Perform the update
      const result = await ReplacementOrder.updateMany(
        { shipping: null },
        { $set: { shipping: {} } }
      );

      console.log("\nMigration result:");
      console.log(`- Matched documents:  ${result.matchedCount}`);
      console.log(`- Modified documents: ${result.modifiedCount}`);

      if (result.modifiedCount === countToFix) {
        console.log("→ All targeted documents were successfully updated.");
      } else {
        console.warn(
          "→ Warning: Number of modified documents doesn't match expected count."
        );
      }

      // Step 3: Verify a few documents (optional but very useful)
      console.log("\nSample of recent documents after migration:");
      const samples = await ReplacementOrder.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("_id replacementId status shipping createdAt");

      samples.forEach((doc) => {
        console.log(`ID: ${doc._id}`);
        console.log(`  replacementId: ${doc.replacementId}`);
        console.log(`  status:        ${doc.status}`);
        console.log(`  shipping:      ${JSON.stringify(doc.shipping, null, 2)}`);
        console.log(`  createdAt:     ${doc.createdAt}`);
        console.log("---");
      });

      console.log("\nMigration finished successfully ✅");
      console.log("You can now safely do deep updates like shipping.amount, shipping.method, etc.");
    } catch (err) {
      console.error("❌ Migration failed:");
      console.error(err.message);
      if (err.stack) console.error(err.stack);
    } finally {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    }
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:");
    console.error(err.message);
  });