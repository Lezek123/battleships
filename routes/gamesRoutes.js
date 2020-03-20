const
    express = require('express'),
    gamesRouter = express.Router();
    mongoose = require('mongoose'),
    config = require('../config/config'),
    CachedGame = mongoose.model('cachedGame'),
    GAME_STATUSES = require('../constants/gameStatuses'),
    { validateAddr, normalizeAddr } = require('../models/types/Address');

const ROWS_PER_PAGE = 10;

const paginate = (queryBuilder, page = 1) => {
    if (page === 'all') return queryBuilder;
    if (page < 1) page = 1;
    return queryBuilder
        .skip((page - 1) * ROWS_PER_PAGE)
        .limit(ROWS_PER_PAGE);
}

const validStatuses = [ ...Object.values(GAME_STATUSES), 'active' ];
const STATUS_REGEX = `(${ validStatuses.join('|') })`;
const statusQuery = (status) => (
    status === 'active' ?
        { status: { $in: [GAME_STATUSES.NEW, GAME_STATUSES.IN_PROGRESS] } }
        : { status }
);
const userQuery = (userAddr) => (
    { $or: [{ creatorAddr: userAddr }, { bomberAddr: userAddr }] }
)

gamesRouter.get('/by_index/:gameIndex([0-9]+)', async (req, res) => {
    const { gameIndex } = req.params;
    let game = await CachedGame.findOne({ gameIndex }).populate('revealedData');
    
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

gamesRouter.get(`/:status(${ STATUS_REGEX })/:page([0-9]+)`, async (req, res) => {
    const { status, page } = req.params;

    let games = await paginate(
        CachedGame.find(statusQuery(status)),
        page
    ).sort({ gameIndex: -1 }).populate('revealedData');
    
    res.send(games);
});

gamesRouter.get(`/count/:status(${ STATUS_REGEX })`, async (req, res) => {
    const { status } = req.params;
    const count = await CachedGame.countDocuments(statusQuery(status));
    
    res.send({ count });
});

gamesRouter.get(`/:status(${ STATUS_REGEX })/:userAddr/:page(([0-9]+)|all)`, async (req, res) => {
    let { userAddr, status, page } = req.params;
    userAddr = normalizeAddr(userAddr) || '';

    if (!validateAddr(userAddr)) {
        res.status(400).send({ error: 'Invalid address' });
        return;
    }

    let games = await paginate(
        CachedGame.find({...statusQuery(status), ...userQuery(userAddr) }),
        page
    ).sort({ gameIndex: -1 }).populate('revealedData');
    
    res.send(games);
});

gamesRouter.get(`/count/:status(${ STATUS_REGEX })/:userAddr`, async (req, res) => {
    let { userAddr, status } = req.params;
    userAddr = normalizeAddr(userAddr) || '';

    if (!validateAddr(userAddr)) {
        res.status(400).send({ error: 'Invalid address' });
        return;
    }

    const count = await CachedGame.countDocuments({...statusQuery(status), ...userQuery(userAddr) });
    
    res.send({ count });
});

module.exports = gamesRouter;
