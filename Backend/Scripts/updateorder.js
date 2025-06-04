import mongoose from "mongoose";
import { Order, Counter } from '../models/order.js'; // Path to order.js in models folder
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest")
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    try {
      // Find orders with invalid status values (not in the updated enum)
      const validStatuses = [
        "Locate Pending",
        "PO Pending",
        "PO Send",
        "PO Confirmed",
        "Vendor Payment Pending",
        "Vendor Payment Confirmed",
        "Shipping Pending",
        "Ship Out",
        "Instransit",
        "Delivered",
        "Replacement"
      ];
      const ordersWithInvalidStatus = await Order.find({
        status: { $nin: validStatuses }
      });

      if (ordersWithInvalidStatus.length === 0) {
        console.log("✅ All orders have valid status values.");
        await mongoose.disconnect();
        return;
      }

      console.log(`🔄 Found ${ordersWithInvalidStatus.length} orders with invalid status values.`);

      let modifiedCount = 0;

      // Process each order with invalid status sequentially
      for (const order of ordersWithInvalidStatus) {
        try {
          // Set a default status (e.g., "Locate Pending") for invalid statuses
          await Order.updateOne(
            { _id: order._id },
            { $set: { status: "Locate Pending" } }
          );
          modifiedCount++;
          console.log(`✅ Updated order _id: ${order._id} with status: Locate Pending`);
        } catch (err) {
          console.error(`❌ Error updating order _id: ${order._id}`, err);
        }
      }

      console.log(
        `✅ Successfully updated ${modifiedCount} orders with valid status.`
      );
    } catch (err) {
      console.error("❌ Error updating orders", err);
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