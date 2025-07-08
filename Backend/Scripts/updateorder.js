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
      // Find all orders
      const allOrders = await Order.find({});

      if (allOrders.length === 0) {
        console.log("✅ No orders found in the collection.");
        await mongoose.disconnect();
        return;
      }

      console.log(`🔄 Found ${allOrders.length} orders in the collection.`);

      let modifiedCount = 0;

      // Update each order to add picturesReceivedFromYard and picturesSentToCustomer fields
      for (const order of allOrders) {
        try {
          const result = await Order.updateOne(
            { _id: order._id },
            { 
              $set: { 
                picturesReceivedFromYard: false, // Initialize as false
                picturesSentToCustomer: false // Initialize as false
              } 
            },
            { 
              // Only update if fields don't exist
              $setOnInsert: { picturesReceivedFromYard: false, picturesSentToCustomer: false }
            }
          );
          if (result.modifiedCount > 0) {
            modifiedCount++;
            console.log(`✅ Updated order _id: ${order._id} with pictures fields`);
          } else {
            console.log(`ℹ️ Order _id: ${order._id} already has pictures fields`);
          }
        } catch (err) {
          console.error(`❌ Error updating order _id: ${order._id}`, err);
        }
      }

      console.log(
        `✅ Successfully updated ${modifiedCount} orders with pictures fields.`
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