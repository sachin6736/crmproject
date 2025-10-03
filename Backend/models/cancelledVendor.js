import mongoose from "mongoose";

// CanceledVendor schema to store details of canceled vendors
const canceledVendorSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  vendor: {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number'],
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    },
    agentName: {
      type: String,
      required: true,
      trim: true,
    },
    totalCost: {
      type: Number,
      required: true, 
      min: [0, 'Total cost cannot be negative'],
    },
    notes: [{
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  cancellationReason: {
    type: String,
    trim: true,
    default: '',
  },
  canceledAt: {
    type: Date,
    default: Date.now,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  paidAt: {
    type: Date,
  },
});

const CanceledVendor = mongoose.model("CanceledVendor", canceledVendorSchema);

export default CanceledVendor;