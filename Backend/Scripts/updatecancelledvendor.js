import mongoose from "mongoose";
import CanceledVendor from '../models/cancelledVendor.js'; // Corrected path
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest")
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    try {
      // Find all canceled vendors
      const allCanceledVendors = await CanceledVendor.find({});

      if (allCanceledVendors.length === 0) {
        console.log("✅ No canceled vendors found in the collection.");
        await mongoose.disconnect();
        return;
      }

      console.log(`🔄 Found ${allCanceledVendors.length} canceled vendors in the collection.`);

      let modifiedCount = 0;

      // Update each canceled vendor to add paymentStatus field
      for (const vendor of allCanceledVendors) {
        try {
          const result = await CanceledVendor.updateOne(
            { _id: vendor._id },
            { 
              $set: { 
                paymentStatus: 'pending' // Initialize as 'pending'
              } 
            },
            { 
              // Only update if field doesn't exist
              $setOnInsert: { paymentStatus: 'pending' }
            }
          );
          if (result.modifiedCount > 0) {
            modifiedCount++;
            console.log(`✅ Updated canceled vendor _id: ${vendor._id} with paymentStatus field`);
          } else {
            console.log(`ℹ️ Canceled vendor _id: ${vendor._id} already has paymentStatus field`);
          }
        } catch (err) {
          console.error(`❌ Error updating canceled vendor _id: ${vendor._id}`, err);
        }
      }

      console.log(
        `✅ Successfully updated ${modifiedCount} canceled vendors with paymentStatus field.`
      );
    } catch (err) {
      console.error("❌ Error updating canceled vendors", err);
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