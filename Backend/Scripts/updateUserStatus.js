import mongoose from "mongoose";
import User from "../models/user.js"; // adjust if your model is elsewhere

mongoose.connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest") // replace with your actual URI
  .then(async () => {
    const result = await User.updateMany(
      { Access: { $exists: false } },
      { $set: { Access: false } }
    );
    console.log(`✅ Updated ${result.modifiedCount} users with default Access.`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error connecting to MongoDB", err);
  });