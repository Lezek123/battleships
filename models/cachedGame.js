const
    mongoose = require('mongoose'),
    { Schema } = mongoose,
    Address = require('./types/Address').default,
    gameStatuses = require('../constants/gameStatuses');

const schemaOptions = { toJSON: { virtuals: true } };
const cachedGameSchema = new Schema({
    gameIndex: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
    },
    status: {
        type: String,
        enum: Object.values(gameStatuses),
        required: true,
    },
    lastEventBlock: {
        type: Number,
        index: true,
        required: true
    },
    prize: { type: Number, required: true },
    bombCost: { type: Number, required: true },
    paidBombsCost: { type: Number, default: null },
    creatorAddr: { ...Address, required: true },
    bomberAddr: { ...Address, default: null },
    bombsBoard: { type: Array, default: null },
    creationHash: { type: String, required: true },
    joinTimeoutBlocks: { type: Number, required: true },
    revealTimeoutBlocks: { type: Number, required: true },
    joinTimeoutBlockNumber: { type: Number, required: true },
    revealTimeoutBlockNumber: { type: Number, default: null },
    isCreatorClaimer: { type: Boolean, default: null },
    creationTx: { type: String, required: true },
    bombingTx: { type: String, default: null },
    finishingTx: { type: String, default: null },
    claimReason: { type: String, enum: ['Join Timeout', 'Reveal Timeout'], default: null }
}, schemaOptions);

cachedGameSchema.virtual('revealedData', {
    ref: 'revealedData',
    localField: 'gameIndex',
    foreignField: 'gameIndex',
    justOne: true
});

mongoose.model('cachedGame', cachedGameSchema);