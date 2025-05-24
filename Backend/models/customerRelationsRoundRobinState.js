import mongoose from 'mongoose';

const customerRelationsRoundRobinStateSchema = new mongoose.Schema({
  currentIndex: {
    type: Number,
    default: 0,
  },
});

const CustomerRelationsRoundRobinState = mongoose.model('CustomerRelationsRoundRobinState', customerRelationsRoundRobinStateSchema);

export default CustomerRelationsRoundRobinState;