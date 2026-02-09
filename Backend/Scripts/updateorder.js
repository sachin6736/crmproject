// scripts/verify-refund-statuses.js
// Run once after adding "Refund" and "Refund Completed" to Order.status enum

import mongoose from "mongoose";
import { Order } from "../models/order.js"; // adjust path
import dotenv from "dotenv";

dotenv.config();

const VALID_STATUSES = [
  "Locate Pending",
  "PO Pending",
  "PO Sent",
  "PO Confirmed",
  "Vendor Payment Pending",
  "Vendor Payment Confirmed",
  "Shipping Pending",
  "Ship Out",
  "Intransit",
  "Delivered",
  "Replacement",
  "Litigation",
  "Replacement Cancelled",
  "Resolved",
  "Refund",
  "Refund Completed"           // ← both new ones
];

mongoose
  .connect(
    process.env.MONGO_URI ||
    "mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest"
  )
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    try {
      console.log("🔍 Verifying order statuses after adding Refund & Refund Completed...");

      // 1. Total orders
      const total = await Order.countDocuments();
      console.log(`Total orders: ${total}`);

      // 2. Invalid statuses?
      const invalid = await Order.find({
        status: { $nin: VALID_STATUSES }
      }).select("order_id status");

      if (invalid.length > 0) {
        console.warn(`⚠️ ${invalid.length} orders have INVALID status:`);
        invalid.forEach(o => {
          console.log(`- Order ${o.order_id || o._id}: "${o.status}"`);
        });
        console.log("→ Fix these manually before using new statuses.");
      } else {
        console.log("✅ All orders have valid statuses.");
      }

      // 3. Status distribution
      console.log("\n📊 Current status breakdown:");
      const counts = await Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      counts.forEach(c => {
        console.log(`- ${c._id || "(missing)"}: ${c.count} orders`);
      });

      // 4. Refund & Refund Completed overview
      const refundCount = await Order.countDocuments({ status: "Refund" });
      const completedCount = await Order.countDocuments({ status: "Refund Completed" });

      console.log(`\nRefund status summary:`);
      console.log(`→ In "Refund": ${refundCount} orders`);
      console.log(`→ In "Refund Completed": ${completedCount} orders`);

      if (refundCount > 0) {
        const samples = await Order.find({ status: "Refund" })
          .select("order_id clientName status")
          .limit(3);
        console.log("Sample Refund orders:");
        samples.forEach(o => console.log(`  - ${o.order_id}: ${o.clientName || "N/A"}`));
      }

      console.log("\nVerification complete ✅");
      console.log("You can now safely use Refund & Refund Completed statuses.");
    } catch (err) {
      console.error("❌ Script failed:", err);
    } finally {
      await mongoose.disconnect();
      console.log("Disconnected.");
    }
  })
  .catch(err => console.error("❌ Connection failed:", err));