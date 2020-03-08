const
    mongoose = require('mongoose'),
    { Schema } = mongoose;

// Some basic validation
const seedValidator = (seed) => seed.length === 32;
const shipsValidator = (ships) => ships.length === 5;

const revealedGameSchema = new Schema({
    gameIndex: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
    },
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
});

mongoose.model('revealedGame', revealedGameSchema);