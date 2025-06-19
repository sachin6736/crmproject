import mongoose from 'mongoose';

const vendorSimpleSchema = new mongoose.Schema({
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
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const VendorSimple = mongoose.model('VendorSimple', vendorSimpleSchema);

export default VendorSimple;