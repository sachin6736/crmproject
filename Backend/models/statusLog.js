import mongoose from 'mongoose';

const statusLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['Available', 'OnBreak', 'Lunch', 'Meeting', 'LoggedOut'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now, required: true },
});

const StatusLog = mongoose.model('StatusLog', statusLogSchema);
export default StatusLog;