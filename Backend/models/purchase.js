import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema({
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
    required: true,
    min: [0, 'Core price cannot be negative']
  },
  totalCost: {
    type: Number,
    required: true,
    min: [0, 'Total cost cannot be negative']
  },
  trackingNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  carrierName: {
    type: String,
    required: true,
    trim: true
  },
  estimatedArrivalTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

export { PurchaseOrder };