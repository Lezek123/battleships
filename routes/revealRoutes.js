const
    express = require('express'),
    revealRouter = express.Router();
    mongoose = require('mongoose'),
    config = require('../config/config'),
    CachedGame = mongoose.model('cachedGame'),
    { calcGameHash } = require('../helpers/hashing');

revealRouter.post('/', async (req, res) => {
    let { seed, gameIndex, ships } = req.body;

    const game = await CachedGame.findOne({ gameIndex });

    if (!game) {
        res.status(404).send({ error: 'Game not found' });
        return;
    }

    if (game.revealedData.ships.length && game.revealedData.seed) {
        res.status(304).send({ error: 'This game was already revealed' });
        return;
    }

    game.revealedData = { ships, seed };
    // Validate basic structure
    const validationFailed = game.validateSync();
    if (validationFailed) {
        const { errors = [] } = validationFailed;
        console.log('Validation errors', errors);
        res.status(400).send({ error: `Request basic validation failed!${ errors.length ? ' Errors: ' + errors.join('; ') : '' }` });
        return;
    }

    // Validate if the revealed seed is actually correct:
    const seedHash = '0x'+calcGameHash(ships, seed).toString('hex');
    if (seedHash !== game.creationHash) {
        res.status(400).send({ error: 'The revealed seed is incorrect' });
        return;
    }

    // Save revealed game data
    try {
        // TODO: FineOneAndUpdate (will be actually atomic? Research that)
        await game.save();
        res.status(200).send('OK');
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: 'Could not save the data' });
    }
});

revealRouter.get('/:gameIndex', async (req, res) => {
    let { gameIndex } = req.params;

    const { revealedData = false } = await CachedGame
        .findOne({ gameIndex })
        .select('-_id revealedData')
        .lean();

    res.json(revealedData);
});


module.exports = revealRouter;
