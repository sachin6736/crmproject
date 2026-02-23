// scripts/migrate-add-customerPaymentDetails.js
// Adds customerPaymentDetails field to all existing orders

import mongoose from "mongoose";
import { Order } from "../models/order.js"; // adjust path if needed
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
      console.log("🔧 Adding customerPaymentDetails to all orders...");

      // 1. Count total orders
      const total = await Order.countDocuments();
      console.log(`Total orders in database: ${total}`);

      // 2. Count how many already have the field (safety check)
      const alreadyHave = await Order.countDocuments({
        customerPaymentDetails: { $exists: true },
      });

      console.log(`→ ${alreadyHave} orders already have customerPaymentDetails`);
      console.log(`→ ${total - alreadyHave} orders will be updated`);

      if (total - alreadyHave === 0) {
        console.log("All orders already have the field → nothing to do.");
        return;
      }

      // 3. Define the default value for the new field
      const defaultPaymentDetails = {
        isConfirmed: false,
        confirmedAt: null,
        confirmedBy: null,
        amountConfirmed: 0,
        notes: "",
      };

      // 4. Bulk update: add the field only where it doesn't exist
      const result = await Order.updateMany(
        { customerPaymentDetails: { $exists: false } },
        { $set: { customerPaymentDetails: defaultPaymentDetails } }
      );

      console.log(`\nMigration result:`);
      console.log(`→ Matched documents: ${result.matchedCount}`);
      console.log(`→ Modified documents: ${result.modifiedCount}`);

      // 5. Optional: Show a few sample documents after update
      const samples = await Order.find(
        {},
        {
          order_id: 1,
          clientName: 1,
          amount: 1,
          customerPaymentDetails: 1,
          _id: 0,
        }
      )
        .limit(3)
        .lean();

      console.log("\nSample orders after migration:");
      samples.forEach((order, index) => {
        console.log(`Order ${index + 1}:`);
        console.log(`  Order ID: ${order.order_id || "N/A"}`);
        console.log(`  Client: ${order.clientName || "N/A"}`);
        console.log(`  Amount: $${order.amount || "N/A"}`);
        console.log("  customerPaymentDetails:", order.customerPaymentDetails);
        console.log("  ────────────────────────");
      });

      console.log("\nMigration completed successfully ✅");
      console.log("You can now safely use customerPaymentDetails in your application.");
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