// import mongoose from "mongoose";
// import { Order, Counter } from '../models/order.js'; // Path to order.js in models folder
// import dotenv from 'dotenv';

// dotenv.config();

// // Connect to MongoDB
// mongoose
//   .connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest")
//   .then(async () => {
//     console.log("✅ Connected to MongoDB");
//     try {
//       // Find all orders
//       const allOrders = await Order.find({});

//       if (allOrders.length === 0) {
//         console.log("✅ No orders found in the collection.");
//         await mongoose.disconnect();
//         return;
//       }

//       console.log(`🔄 Found ${allOrders.length} orders in the collection.`);

//       let modifiedCount = 0;

//       // Update each order to add new fields with blank values
//       for (const order of allOrders) {
//         try {
//           await Order.updateOne(
//             { _id: order._id },
//             { 
//               $set: { 
//                 weightAndDimensions: {}, // Empty object for weightAndDimensions
//                 carrierName: "",        // Empty string for carrierName
//                 trackingNumber: ""      // Empty string for trackingNumber
//               } 
//             }
//           );
//           modifiedCount++;
//           console.log(`✅ Updated order _id: ${order._id} with blank fields (weightAndDimensions, carrierName, trackingNumber)`);
//         } catch (err) {
//           console.error(`❌ Error updating order _id: ${order._id}`, err);
//         }
//       }

//       console.log(
//         `✅ Successfully updated ${modifiedCount} orders with blank fields.`
//       );
//     } catch (err) {
//       console.error("❌ Error updating orders", err);
//     } finally {
//       try {
//         await mongoose.disconnect();
//         console.log("✅ Disconnected from MongoDB");
//       } catch (err) {
//         console.error("❌ Error disconnecting from MongoDB", err);
//       }
//     }
//   })
//   .catch((err) => {
//     console.error("❌ Error connecting to MongoDB", err);
//   });
//==========adding weight,tracking etc


// import mongoose from "mongoose";
// import { Order, Counter } from '../models/order.js'; // Adjust path to your order model
// import dotenv from 'dotenv';

// dotenv.config();

// // Connect to MongoDB
// mongoose
//   .connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest")
//   .then(async () => {
//     console.log("✅ Connected to MongoDB");
//     try {
//       // Find all orders
//       const allOrders = await Order.find({});

//       if (allOrders.length === 0) {
//         console.log("✅ No orders found in the collection.");
//         await mongoose.disconnect();
//         return;
//       }

//       console.log(`🔄 Found ${allOrders.length} orders in the collection.`);

//       let modifiedCount = 0;

//       // Update each order to add new fields with blank values
//       for (const order of allOrders) {
//         try {
//           await Order.updateOne(
//             { _id: order._id },
//             { 
//               $set: { 
//                 bolNumber: "",      // Empty string for bolNumber
//                 trackingLink: ""    // Empty string for trackingLink
//               } 
//             }
//           );
//           modifiedCount++;
//           console.log(`✅ Updated order _id: ${order._id} with blank fields (bolNumber, trackingLink)`);
//         } catch (err) {
//           console.error(`❌ Error updating order _id: ${order._id}`, err);
//         }
//       }

//       console.log(
//         `✅ Successfully updated ${modifiedCount} orders with blank fields.`
//       );
//     } catch (err) {
//       console.error("❌ Error updating orders", err);
//     } finally {
//       try {
//         await mongoose.disconnect();
//         console.log("✅ Disconnected from MongoDB");
//       } catch (err) {
//         console.error("❌ Error disconnecting from MongoDB", err);
//       }
//     }
//   })
//   .catch((err) => {
//     console.error("❌ Error connecting to MongoDB", err);
//   });//adding bol number and tracking


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

      // Update each order to add notes array to vendors
      for (const order of allOrders) {
        try {
          const result = await Order.updateOne(
            { _id: order._id },
            { 
              $set: { 
                'vendors.$[].notes': [] // Initialize notes as empty array for all vendors
              } 
            }
          );
          if (result.modifiedCount > 0) {
            modifiedCount++;
            console.log(`✅ Updated order _id: ${order._id} with blank notes array for vendors`);
          } else {
            console.log(`ℹ️ Order _id: ${order._id} already has notes array for vendors`);
          }
        } catch (err) {
          console.error(`❌ Error updating order _id: ${order._id}`, err);
        }
      }

      console.log(
        `✅ Successfully updated ${modifiedCount} orders with blank notes array for vendors.`
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