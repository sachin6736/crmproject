// models/ReplacementOrder.js
import mongoose from "mongoose";

const replacementOrderSchema = new mongoose.Schema({
  originalOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  partDetails: {
    partRequested: { type: String, required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: String, required: true },
  },
  replacementId: {
    type: String,
    unique: true,
    required: true,
  },
  status: {
    type: String,
    enum: [
      'ReplacementRequested',
      'WaitingShipment',
      'InTransit',
      'Delivered'
    ],
    default: 'ReplacementRequested',
    required: true
  },
  shipping: {
    type: {
      method: {
        type: String,
        enum: ['customer', 'vendor', 'own'],
        required: false,   // becomes required only after submission
      },
      trackingId: {
        type: String,
        trim: true,
        default: ''
      },
      carrier: {
        type: String,
        trim: true,
        default: ''
      },
      amount: {
        type: Number,
        min: 0,
        default: 0          // only used when method = 'own'
      }
    },
    default: {}
  },

  // ────────────────────────────────────────────────
  //        Notes – exactly like Lead model
  // ────────────────────────────────────────────────
  notes: [
    {
      text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,  // same limit as Lead
      },
      addedBy: {
        type: String,     // ← username string, no ref/populate needed
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
    },
  ],

  createdAt: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true
});

export default mongoose.model('ReplacementOrder', replacementOrderSchema);