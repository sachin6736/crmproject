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

      // Update each canceled vendor to add paidAt field if missing
      for (const vendor of allCanceledVendors) {
        // Check if paidAt field is missing (undefined or null)
        if (vendor.paidAt === undefined || vendor.paidAt === null) {
          try {
            const result = await CanceledVendor.updateOne(
              { _id: vendor._id },
              { 
                $set: { 
                  paidAt: null // Initialize as null
                } 
              }
            );
            if (result.modifiedCount > 0) {
              modifiedCount++;
              console.log(`✅ Updated canceled vendor _id: ${vendor._id} with paidAt field`);
            }
          } catch (err) {
            console.error(`❌ Error updating canceled vendor _id: ${vendor._id}`, err);
          }
        } else {
          console.log(`ℹ️ Canceled vendor _id: ${vendor._id} already has paidAt field`);
        }
      }

      console.log(
        `✅ Successfully updated ${modifiedCount} canceled vendors with paidAt field.`
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