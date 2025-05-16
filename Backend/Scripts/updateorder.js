import mongoose from "mongoose";
import { Order,Counter } from '../models/order.js'// Import both Order and Counter from order.js

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest"
  )
  .then(async () => {
    try {
      // Find orders without order_id
      const ordersToUpdate = await Order.find({ order_id: { $exists: false } });

      let modifiedCount = 0;

      // Process each order sequentially to assign order_id
      for (const order of ordersToUpdate) {
        // Get and increment the counter
        const counter = await Counter.findOneAndUpdate(
          { _id: "order_id" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true } // Create counter if it doesn't exist, starting at 123456
        );

        // Update the order with the new order_id
        await Order.updateOne(
          { _id: order._id },
          { $set: { order_id: counter.seq } }
        );

        modifiedCount++;
      }

      console.log(
        `✅ Updated ${modifiedCount} orders with order_id field starting from 123456.`
      );
    } catch (err) {
      console.error("❌ Error updating orders", err);
    } finally {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    }
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB", err);
  });