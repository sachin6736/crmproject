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
      // Find orders with "PO Send" status
      const ordersWithPOSend = await Order.find({
        status: "PO Send"
      });

      if (ordersWithPOSend.length === 0) {
        console.log("✅ No orders found with 'PO Send' status.");
        await mongoose.disconnect();
        return;
      }

      console.log(`🔄 Found ${ordersWithPOSend.length} orders with 'PO Send' status.`);

      let modifiedCount = 0;

      // Update each order with "PO Send" to "PO Sent"
      for (const order of ordersWithPOSend) {
        try {
          await Order.updateOne(
            { _id: order._id },
            { $set: { status: "PO Sent" } }
          );
          modifiedCount++;
          console.log(`✅ Updated order _id: ${order._id} from 'PO Send' to 'PO Sent'`);
        } catch (err) {
          console.error(`❌ Error updating order _id: ${order._id}`, err);
        }
      }

      console.log(
        `✅ Successfully updated ${modifiedCount} orders to 'PO Sent' status.`
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