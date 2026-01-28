import mongoose from "mongoose";

const litigationNoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  createdByName: {
    type: String,
    required: false,
    default: "System",
  },
});

const litigationHistoryEntry = new mongoose.Schema({
  // Snapshot of previous values
  deliveryDate:          { type: Date },
  installationDate:      { type: Date },
  problemOccurredDate:   { type: Date },
  problemInformedDate:   { type: Date },
  receivedPictures:      { type: Boolean },
  receivedDiagnosticReport: { type: Boolean },
  problemDescription:    { type: String, trim: true },
  resolutionNotes:       { type: String, trim: true },

  // Who & when
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,           // not required → old entries won't break
  },
  updatedByName: {
    type: String,
    required: false,
    default: "System",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Nice to have: quick summary of what changed
  changeSummary: {
    type: String,
    trim: true,
  },
});

const litigationSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true,
  },

  // Current (latest) values
  deliveryDate:          { type: Date },
  installationDate:      { type: Date },
  problemOccurredDate:   { type: Date },
  problemInformedDate:   { type: Date },
  receivedPictures:      { type: Boolean, default: false },
  receivedDiagnosticReport: { type: Boolean, default: false },
  problemDescription:    { type: String, trim: true, default: "" },
  resolutionNotes:       { type: String, trim: true, default: "" },

  // History array
  history: [litigationHistoryEntry],
  litigationNotes: [litigationNoteSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

const Litigation = mongoose.model("Litigation", litigationSchema);
export default Litigation;