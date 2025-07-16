import mongoose from "mongoose";

const litigationSchema = new mongoose.Schema({
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    deliveryDate: {
      type: Date,
      required: false
    },
    installationDate: {
      type: Date,
      required: false
    },
    problemOccurredDate: {
      type: Date,
      required: false
    },
    problemInformedDate: {
      type: Date,
      required: false
    },
    receivedPictures: {
      type: Boolean,
      default: false
    },
    receivedDiagnosticReport: {
      type: Boolean,
      default: false
    },
    problemDescription: {
      type: String,
      trim: true,
      required: false
    },
    resolutionNotes: {
      type: String,
      trim: true,
      required: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }, {
    timestamps: true // Automatically updates createdAt and updatedAt
  });

  const Litigation = mongoose.model("Litigation",litigationSchema);
  export default Litigation;