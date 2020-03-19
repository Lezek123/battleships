const
    express = require('express'),
    gamesRouter = express.Router();
    mongoose = require('mongoose'),
    config = require('../config/config'),
    CachedGame = mongoose.model('cachedGame'),
    GAME_STATUSES = require('../constants/gameStatuses'),
    { validateAddr, normalizeAddr } = require('../models/types/Address');

gamesRouter.get('/by_index/:gameIndex', async (req, res) => {
    const { gameIndex } = req.params;
    let game = await CachedGame.findOne({ gameIndex });
    
    res.send(game);
});

gamesRouter.get('/awaiting_reveal/:userAddr', async (req, res) => {
    let { userAddr } = req.params;
    userAddr = normalizeAddr(userAddr) || '';

    if (!validateAddr(userAddr)) {
        res.status(400).send({ error: 'Invalid address' });
        return;
    }

    let games = await CachedGame.find({
        status: GAME_STATUSES.IN_PROGRESS,
        revealedData: { $eq: null },
        creatorAddr: userAddr,
    });

    res.send(games);
});

gamesRouter.get('/:status', async (req, res) => {
    const { status } = req.params;
    if (status !== 'active' && !Object.values(GAME_STATUSES).includes(status)) {
        res.status(400).send({ error: 'Invalid status' });
        return;
    }
    let games = await CachedGame.find({
        status: status === 'active' ? { $in: [GAME_STATUSES.NEW, GAME_STATUSES.IN_PROGRESS] } : status,
    });
    
    res.send(games);
});

gamesRouter.get('/:userAddr/:status', async (req, res) => {
    let { userAddr, status } = req.params;
    userAddr = normalizeAddr(userAddr) || '';

    if (status !== 'active' && !Object.values(GAME_STATUSES).includes(status)) {
        res.status(400).send({ error: 'Invalid status' });
        return;
    }

    if (!validateAddr(userAddr)) {
        res.status(400).send({ error: 'Invalid address' });
        return;
    }

    let games = await CachedGame.find({
        status: status === 'active' ? { $in: [GAME_STATUSES.NEW, GAME_STATUSES.IN_PROGRESS] } : status,
        $or: [{ creatorAddr: userAddr }, { bomberAddr: userAddr }]
    });
    
    res.send(games);
});

module.exports = gamesRouter;
