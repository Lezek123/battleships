const
    express = require('express'),
    revealRouter = express.Router();
    mongoose = require('mongoose'),
    config = require('../config/config'),
    RevealedGame = mongoose.model('revealedGame'),
    { sha256, calcGameHash } = require('../helpers/hashing'),
    TruffleContract = require('@truffle/contract'),
    MainContractAbi = require('../build/contracts/GameOfShips.json');

revealRouter.post('/', async (req, res) => {
    let { seed, gameIndex, ships } = req.body;

    const revealedGame = new RevealedGame({ seed, gameIndex, ships });

    // Validate basic structure
    const validationFailed = revealedGame.validateSync();
    if (validationFailed) {
        const { errors = [] } = validationFailed;
        res.status(400).send({ error: `Request basic validation failed!${ errors.length ? ' Errors: ' + errors.join('; ') : '' }` });
        return;
    }

    // Check if already revealed
    if (await RevealedGame.findOne({ gameIndex })) {
        res.status(400).send({ error: 'This game was already revealed' });
        return;
    }
    
    // Check if contract exists
    const MainContract = TruffleContract(MainContractAbi);
    MainContract.setProvider(config.web3Provider);
    const MainContractInstance = await MainContract.deployed();
    const game = await MainContractInstance.games(gameIndex);
    if (!game) {
        res.status(400).send({ error: 'Game not found' });
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
        await revealedGame.save();
        res.status(200).send('OK');
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: 'Could not save the data' });
    }
});

revealRouter.get('/:gameIndex', async (req, res) => {
    let { gameIndex } = req.params;

    const revealedGameData = await RevealedGame
        .findOne({ gameIndex })
        .select('-_id gameIndex ships seed')
        .lean();

    res.json(revealedGameData);
});


module.exports = revealRouter;
