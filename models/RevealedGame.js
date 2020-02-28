const
    mongoose = require('mongoose'),
    { Schema } = mongoose;

// Some basic validation
const addressValidator = (address) => address.match(/^0x[0-9a-f]{40}$/);
const seedValidator = (seed) => seed.length === 32;
const shipsValidator = (ships) => ships.length === 5;

const revealedGameSchema = new Schema({
    address: {
        type: String,
        required: true,
        unique: true,
        validate: { validator: addressValidator, message: 'Invalid address' }
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