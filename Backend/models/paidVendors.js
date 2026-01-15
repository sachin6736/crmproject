// models/PaidVendor.js
import mongoose from "mongoose";

const paidVendorSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true,
  },
  order_id: {
    type: String,
    required: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  make: String,
  model: String,
  year: String,

  // Full vendor details (snapshot at time of payment)
  vendor: {
    businessName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    agentName: { type: String, required: true },
    costPrice: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    corePrice: { type: Number, default: 0 },
    totalCost: { type: Number, required: true },
    warranty: String,
    mileage: Number,
    rating: { type: Number, min: 0, max: 5, default: 0 },
    notes: [
      {
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },

  paidBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: String,
  },

  paidAt: {
    type: Date,
    default: Date.now,
    index: true, // For sorting by latest payments
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for fast search
paidVendorSchema.index({
  "vendor.businessName": "text",
  "vendor.phoneNumber": "text",
  "vendor.email": "text",
  "vendor.agentName": "text",
  order_id: "text",
});

const PaidVendor = mongoose.model("PaidVendor", paidVendorSchema);

export default PaidVendor;