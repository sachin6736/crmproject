import mongoose from "mongoose";
import { Order, Counter } from '../models/order.js'; // Path to order.js in models folder
import dotenv from 'dotenv';

     dotenv.config();

    //  // Validate MONGODB_URI
    //  if (!process.env.MONGODB_URI) {
    //    console.error("❌ MONGODB_URI is not defined in .env file");
    //    process.exit(1);
    //  }

     // Connect to MongoDB
     mongoose
       .connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest")
       .then(async () => {
         console.log("✅ Connected to MongoDB");
         try {
      // Find orders without procurementnotes
      const ordersToUpdate = await Order.find({
        procurementnotes: { $exists: false }
      });

      if (ordersToUpdate.length === 0) {
        console.log("✅ No orders found needing procurementnotes updates.");
        await mongoose.disconnect();
        return;
      }

      console.log(`🔄 Found ${ordersToUpdate.length} orders to update.`);

      let modifiedCount = 0;

      // Process each order sequentially
      for (const order of ordersToUpdate) {
        try {
          // Initialize procurementnotes as empty array
          await Order.updateOne(
            { _id: order._id },
            { $set: { procurementnotes: [] } }
          );
          modifiedCount++;
          console.log(`✅ Updated order _id: ${order._id} with procurementnotes field`);
        } catch (err) {
          console.error(`❌ Error updating order _id: ${order._id}`, err);
        }
      }

      console.log(
        `✅ Successfully updated ${modifiedCount} orders with procurementnotes field.`
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