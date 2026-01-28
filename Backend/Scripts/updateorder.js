import mongoose from "mongoose";
import { Order } from "../models/order.js"; // Adjust path to your Order model
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
  "Resolved"  // ← the new one
];

mongoose
  .connect(process.env.MONGO_URI || "mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    try {
      console.log("🔍 Verifying order statuses after adding 'Resolved'...");

      // 1. Count total orders
      const totalOrders = await Order.countDocuments();
      console.log(`Total orders in collection: ${totalOrders}`);

      // 2. Find orders with invalid (non-enum) statuses
      const invalidOrders = await Order.find({
        status: { $nin: VALID_STATUSES }
      }).select("order_id status");

      if (invalidOrders.length > 0) {
        console.warn(`⚠️ Found ${invalidOrders.length} orders with INVALID status:`);
        invalidOrders.forEach(o => {
          console.log(`- Order ${o.order_id || o._id}: status = "${o.status}"`);
        });
        console.log("You may want to manually fix these before proceeding.");
      } else {
        console.log("✅ All orders have valid statuses (including the new 'Resolved').");
      }

      // 3. Count orders in each status (for overview)
      console.log("\n📊 Status distribution:");
      const statusCounts = await Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      statusCounts.forEach(s => {
        console.log(`- ${s._id || "No status"}: ${s.count} orders`);
      });

      // 4. Optional: Sample of Resolved orders (if any exist)
      const resolvedCount = await Order.countDocuments({ status: "Resolved" });
      console.log(`\nOrders already in "Resolved": ${resolvedCount}`);
      if (resolvedCount > 0) {
        const samples = await Order.find({ status: "Resolved" })
          .select("order_id clientName status")
          .limit(5);
        console.log("Sample Resolved orders:");
        samples.forEach(o => console.log(`- ${o.order_id}: ${o.clientName}`));
      }

      console.log("\nMigration/verification completed ✅");
      console.log("You can now safely use the 'Resolved' status in your app.");
    } catch (err) {
      console.error("❌ Script failed:", err);
    } finally {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    }
  })
  .catch(err => {
    console.error("❌ Failed to connect:", err);
  });