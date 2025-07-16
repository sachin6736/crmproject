import mongoose from "mongoose";
import { Order, Counter } from "../models/order.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest")
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    try {
      // Find all orders to verify their order_id values
      const allOrders = await Order.find({});

      if (allOrders.length === 0) {
        console.log("✅ No orders found in the collection.");
        await mongoose.disconnect();
        return;
      }

      console.log(`🔄 Found ${allOrders.length} orders in the collection.`);

      let invalidOrders = 0;

      for (const order of allOrders) {
        try {
          if (typeof order.order_id === "number") {
            console.warn(`⚠️ Order _id: ${order._id} has numeric order_id: ${order.order_id}, converting to string`);
            order.order_id = order.order_id.toString();
            await order.save();
            console.log(`✅ Converted order_id for order _id: ${order._id} to ${order.order_id}`);
            invalidOrders++;
          } else if (typeof order.order_id === "string") {
            console.log(`✅ Order _id: ${order._id} has valid string order_id: ${order.order_id}`);
          } else {
            console.warn(`⚠️ Order _id: ${order._id} has invalid order_id type: ${typeof order.order_id}`);
            invalidOrders++;
          }
        } catch (err) {
          console.error(`❌ Error processing order _id: ${order._id}`, err);
        }
      }

      if (invalidOrders === 0) {
        console.log("✅ All orders have valid string order_id values.");
      } else {
        console.log(`✅ Updated ${invalidOrders} orders with numeric or invalid order_id values to strings.`);
      }

      console.log("✅ Migration to string order_id completed.");
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