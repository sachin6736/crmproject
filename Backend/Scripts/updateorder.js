import mongoose from "mongoose";
import { Order, Counter } from '../models/order.js'; // Adjust path to your order model
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest")
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    try {
      // Find all orders to verify their status values
      const allOrders = await Order.find({});

      if (allOrders.length === 0) {
        console.log("✅ No orders found in the collection.");
        await mongoose.disconnect();
        return;
      }

      console.log(`🔄 Found ${allOrders.length} orders in the collection.`);

      // Verify that all orders have valid status values
      const validStatuses = [
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
        "Replacement Cancelled"
      ];

      let invalidOrders = 0;

      for (const order of allOrders) {
        try {
          if (!validStatuses.includes(order.status)) {
            console.warn(`⚠️ Order _id: ${order._id} has invalid status: ${order.status}`);
            invalidOrders++;
          } else {
            console.log(`✅ Order _id: ${order._id} has valid status: ${order.status}`);
          }
        } catch (err) {
          console.error(`❌ Error checking order _id: ${order._id}`, err);
        }
      }

      if (invalidOrders === 0) {
        console.log("✅ All orders have valid status values.");
      } else {
        console.warn(`⚠️ Found ${invalidOrders} orders with invalid status values. No updates needed, but review recommended.`);
      }

      // Since the schema change (adding enum values) is non-destructive, no updates are required
      console.log("✅ Schema updated to include new status values: 'Litigation', 'Replacement Cancelled'.");
    } catch (err) {
      console.error("❌ Error during migration", err);
    } finally {
      try {
        await mongoose.disconnect();
        console.log("✅ Disconnected from MongoDB");
      } catch (err) {
        console.error("❌ Error disconnecting from MongoDB", err);
      }
    }
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB", err);
  });