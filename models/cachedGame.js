const
    mongoose = require('mongoose'),
    { Schema } = mongoose,
    Address = require('./types/Address').default,
    gameStatuses = require('../constants/gameStatuses');

// Some basic validation
const seedValidator = (seed) => seed.length === 32;
const shipsValidator = (ships) => ships.length === 5;

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
    revealedData: {
        seed: {
            type: Buffer,
            required: true,
            validate: { validator: seedValidator, message: 'Invalid seed' }
        },
        ships: {
            type: [{ x: Number, y: Number, vertical: Boolean }],
            required: true,
            validate: { validator: shipsValidator, message: 'Invalid array of ships' }
        },
    },
    winner: { type: String, enum: ['Bomber', 'Creator'] },
});

mongoose.model('cachedGame', cachedGameSchema);