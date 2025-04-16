import mongoose from 'mongoose';

const roundRobinStateSchema = new mongoose.Schema({
    currentIndex: { 
        type: Number, 
        default: 0,
    },
});

const RoundRobinState = mongoose.model('RoundRobinState', roundRobinStateSchema);

export default RoundRobinState;