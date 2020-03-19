const
    mongoose = require('mongoose'),
    { Schema } = mongoose,
    events = require('../constants/events');

const cachedEventSchema = new Schema({
    eventName: { type: String, enum: Object.values(events), required: true },
    blockNumber: { type: Number, required: true },
    logIndex: { type: Number, required: true },
    transactionIndex: { type: Number, required: true },
    transactionHash: { type: String, required: true },
    blockHash: { type: String, required: true },
    uniqueIdentifier: { type: String, index: true, required: true },
    gameIndex: { type: Number, required: true, index: true },
    dataJSON: { type: String }
});

mongoose.model('cachedEvent', cachedEventSchema);