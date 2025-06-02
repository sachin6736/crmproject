import mongoose from 'mongoose';

const procurementRoundRobinStateSchema = new mongoose.Schema({
  currentIndex: {
    type: Number,
    default: 0,
  },
});

const ProcurementRoundRobinState = mongoose.model('ProcurementRoundRobinState', procurementRoundRobinStateSchema);

export default ProcurementRoundRobinState;