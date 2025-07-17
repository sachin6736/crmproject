// import mongoose from "mongoose";
// import { Order, Counter } from "../models/order.js";
// import dotenv from "dotenv";

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

//       let updatedOrders = 0;

//       for (const order of allOrders) {
//         try {
//           if (!order.procurementData) {
//             console.log(`⚠️ Order _id: ${order._id} is missing procurementData, adding default values`);
//             order.procurementData = {
//               vendorInformedDate: null,
//               sentPicturesToVendor: false,
//               sentDiagnosticReportToVendor: false,
//               yardAgreedReturnShipping: false,
//               yardAgreedReplacement: false,
//               yardAgreedReplacementShippingCost: false,
//               replacementPartReadyDate: null,
//               additionalCostReplacementPart: '',
//               additionalCostReplacementShipping: '',
//             };
//             await order.save();
//             console.log(`✅ Added procurementData to order _id: ${order._id}`);
//             updatedOrders++;
//           } else {
//             console.log(`✅ Order _id: ${order._id} already has procurementData`);
//           }
//         } catch (err) {
//           console.error(`❌ Error processing order _id: ${order._id}`, err);
//         }
//       }

//       if (updatedOrders === 0) {
//         console.log("✅ All orders already have procurementData field.");
//       } else {
//         console.log(`✅ Updated ${updatedOrders} orders with procurementData field.`);
//       }

//       console.log("✅ Migration for procurementData completed.");
//     } catch (err) {
//       console.error("❌ Error during migration", err);
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

import mongoose from "mongoose";
import { Order } from "../models/order.js";
import dotenv from "dotenv";

dotenv.config();

mongoose
  .connect("mongodb+srv://sachinpradeepan27:crmtest12345@crmtest.tdj6iar.mongodb.net/?retryWrites=true&w=majority&appName=crmtest")
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    try {
      const orders = await Order.find({}, { order_id: 1, procurementData: 1, _id: 1 });
      if (orders.length === 0) {
        console.log("✅ No orders found in the collection.");
        return;
      }

      console.log(`🔄 Found ${orders.length} orders. Inspecting procurementData:`);
      orders.forEach(order => {
        console.log(`Order _id: ${order._id}, order_id: ${order.order_id}`);
        console.log("procurementData:", JSON.stringify(order.procurementData, null, 2));
      });
    } catch (err) {
      console.error("❌ Error inspecting orders", err);
    } finally {
      await mongoose.disconnect();
      console.log("✅ Disconnected from MongoDB");
    }
  })
  .catch(err => console.error("❌ Error connecting to MongoDB", err));