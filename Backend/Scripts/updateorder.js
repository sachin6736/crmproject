import mongoose from "mongoose";
import { Order } from "../models/order.js";
import dotenv from "dotenv";

dotenv.config();

mongoose
  .connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest")
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    try {
      // Define statuses that should have poSent set to true
      const poSentTrueStatuses = [
        "PO Sent",
        "PO Confirmed",
        "Vendor Payment Pending",
        "Vendor Payment Confirmed",
        "Shipping Pending",
        "Ship Out",
        "Intransit",
        "Delivered"
      ];

      // Update orders with specified statuses to set poSent to true
      const updateTrueResult = await Order.updateMany(
        { status: { $in: poSentTrueStatuses } },
        { $set: { poSent: true } }
      );

      // Update orders with other statuses to set poSent to false
      const updateFalseResult = await Order.updateMany(
        { status: { $nin: poSentTrueStatuses } },
        { $set: { poSent: false } }
      );

      console.log(`🔄 Updated ${updateTrueResult.modifiedCount} orders with poSent set to true.`);
      console.log(`🔄 Updated ${updateFalseResult.modifiedCount} orders with poSent set to false.`);

      // Verify the update by fetching and logging a sample of updated documents
      const updatedOrders = await Order.find({}, { order_id: 1, status: 1, poSent: 1, _id: 1 }).limit(10);
      if (updatedOrders.length === 0) {
        console.log("✅ No orders found in the collection.");
      } else {
        console.log(`✅ Sample of updated orders (${updatedOrders.length}):`);
        updatedOrders.forEach(order => {
          console.log(`Order _id: ${order._id}, order_id: ${order.order_id}, status: ${order.status}, poSent: ${order.poSent}`);
        });
      }
    } catch (err) {
      console.error("❌ Error updating orders:", err);
    } finally {
      await mongoose.disconnect();
      console.log("✅ Disconnected from MongoDB");
    }
  })
  .catch(err => console.error("❌ Error connecting to MongoDB:", err));