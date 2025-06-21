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
  weightAndDimensions: {
    weight: { type: Number, required: false, min: 0 },
    height: { type: Number, required: false, min: 0 },
    width: { type: Number, required: false, min: 0 }
  },
  carrierName: {
    type: String,
    required: false
  },
  trackingNumber: {
    type: String,
    required: false
  },
  bolNumber: {
    type: String,
    required: false,
    trim: true
  },
  trackingLink: {
    type: String,
    required: false,
    trim: true,
    match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please enter a valid URL']
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  status: {
    type: String,
    enum: ["Locate Pending", "PO Pending", "PO Sent", "PO Confirmed", "Vendor Payment Pending", "Vendor Payment Confirmed", "Shipping Pending", "Ship Out", "Intransit", "Delivered", "Replacement"],
    default: "Locate Pending",
  },
  vendors: [{
    businessName: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    agentName: {
      type: String,
      required: true,
      trim: true
    },
    costPrice: {
      type: Number,
      required: true,
      min: [0, 'Cost price cannot be negative']
    },
    shippingCost: {
      type: Number,
      required: true,
      min: [0, 'Shipping cost cannot be negative']
    },
    corePrice: {
      type: Number,
      min: [0, 'Core price cannot be negative'],
      default: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0, 'Total cost cannot be negative']
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0
    },
    warranty: {
      type: String,
      trim: true,
      default: ''
    },
    mileage: {
      type: Number,
      min: [0, 'Mileage cannot be negative'],
      default: 0
    },
    isConfirmed: {
      type: Boolean,
      default: false
    },
    poStatus: {
      type: String,
      enum: ["PO Pending", "PO Sent", "PO Confirmed", "PO Canceled"],
      default: "PO Pending"
    },
    notes: [{
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
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