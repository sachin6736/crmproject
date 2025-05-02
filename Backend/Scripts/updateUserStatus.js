import mongoose from "mongoose";
import User from "../models/user.js"; // adjust if your model is elsewhere

mongoose.connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest") // replace with your actual URI
  .then(async () => {
    const result = await User.updateMany(
      { status: { $exists: false } },
      { $set: { status: "Available" } }
    );
    console.log(`✅ Updated ${result.modifiedCount} users with default status.`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error connecting to MongoDB", err);
  });  // adding status filed to users,by database editing