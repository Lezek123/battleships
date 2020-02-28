const
    express = require('express'),
    revealRouter = express.Router();
    mongoose = require('mongoose'),
    config = require('../config/config'),
    RevealedGame = mongoose.model('revealedGame'),
    { sha256, calcGameHash } = require('../helpers/hashing'),
    TruffleContract = require('@truffle/contract'),
    GameOfShipsAbi = require('../build/contracts/GameOfShips.json');

revealRouter.post('/', async (req, res) => {
    let { seed, address, ships } = req.body;
    
    // Normalize address to lowercase
    if (typeof address === 'string') address = address.toLowerCase();

    const revealedGame = new RevealedGame({ seed, address, ships });

    // Validate basic structure
    const validationFailed = revealedGame.validateSync();
    if (validationFailed) {
        const { errors = [] } = validationFailed;
        res.status(400).send({ error: `Request basic validation failed!${ errors.length ? ' Errors: ' + errors.join('; ') : '' }` });
        return;
    }

    // Check if already revealed
    if (await RevealedGame.findOne({ address })) {
        res.status(400).send({ error: 'This game was already revealed' });
        return;
    }
    
    // Check if contract exists
    const GameContract = TruffleContract(GameOfShipsAbi);
    GameContract.setProvider(config.web3Provider);
    const game = await GameContract.at(address);
    if (!game) {
        res.status(400).send({ error: 'Game contract not found' });
        return;
    }

    // Validate if the revealed seed is actually correct:
    const gameCreationHash = await game.creationHash();
    const seedHash = '0x'+calcGameHash(ships, seed).toString('hex');
    if (seedHash !== gameCreationHash) {
        res.status(400).send({ error: 'The revealed seed is incorrect' });
        return;
    }

    // Save revealed game data
    try {
        await revealedGame.save();
        res.status(200).send('OK');
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: 'Could not save the data' });
    }
});

revealRouter.get('/:address', async (req, res) => {
    let { address } = req.params;
    
    // Normalize address to lowercase
    if (typeof address === 'string') address = address.toLowerCase();

    const revealedGameData = await RevealedGame
        .findOne({ address })
        .select('-_id address ships seed')
        .lean();

    res.json(revealedGameData);
});


module.exports = revealRouter;
