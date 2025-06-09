import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 123456 },
});

const Counter = mongoose.model("Counter", counterSchema);

const orderSchema = new mongoose.Schema({
  order_id: {
    type: Number,
    unique: true,
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
  },
  salesPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customerRelationsPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  procurementPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  make: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  cardNumber: {
    type: String,
    required: true,
    match: /^\d{16}$/,
  },
  cardMonth: {
    type: String,
    required: true,
  },
  cardYear: {
    type: String,
    required: true,
  },
  cvv: {
    type: String,
    required: true,
    match: /^\d{3,4}$/,
  },
  billingAddress: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zip: {
    type: String,
    required: true,
  },
  shippingAddress: {
    type: String,
    required: true,
  },
  shippingCity: {
    type: String,
    required: true,
  },
  shippingState: {
    type: String,
    required: true,
  },
  shippingZip: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  status: {
    type: String,
    enum: ["Locate Pending","PO Pending","PO Sent","PO Confirmed","Vendor Payment Pending","Vendor Payment Confirmed","Shipping Pending","Ship Out",
       "Intransit","Delivered", "Replacement"],
    default: "Locate Pending",
  },
  vendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
  }],
  notes: [{
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  procurementnotes: [{
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to assign auto-incrementing order_id
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: "order_id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.order_id = counter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Order = mongoose.model("Order", orderSchema);
export { Order, Counter };