const
    Web3 = require('web3'),
    { BN } = Web3.utils,
    mongoose = require('mongoose'),
    config = require('./config/config'),
    TruffleContract = require('@truffle/contract'),
    MainContractAbi = require('./build/contracts/GameOfShips.json'),
    CachedGame = mongoose.model('cachedGame'),
    CachedEvent = mongoose.model('cachedEvent'),
    RevealedData = mongoose.model('revealedData'),
    { GAME_CREATED, BOMBS_PLACED, SHIPS_REVEALED, GAME_FINISHED, JOIN_TIMEOUT, REVEAL_TIMEOUT } = require('./constants/events'),
    GS = require('./constants/gameStatuses'),
    { sha256, calcGameHash } = require('./helpers/hashing'),
    { BNToBoard } = require('./helpers/converters'),
    { SAFE_CONFRIMATION_BLOCKS } = require('./constants/blockchain'),
    { round } = require('./helpers/math');

const web3 = new Web3();
web3.setProvider(config.web3Provider);

let MainSubscription = null;

const isGameEvent = (event) => (event.args._gameIndex ? true : false);

const getEventIdentifier = (event) => {
    return sha256(event.blockHash + event.transactionHash + event.logIndex).toString('hex');
}

const getValuesByEvent = (event) => {
    let values = {};

    const { eventName, dataJSON } = event;
    const eventData = JSON.parse(dataJSON);

    if (eventName === GAME_CREATED) {
        const { _creator, _creationHash, _prize, _bombCost, _joinTimeoutBlocks, _revealTimeoutBlocks } = eventData;
        values = {
            status: GS.NEW,
            creatorAddr: _creator,
            creationHash: _creationHash,
            creationTx: event.transactionHash,
            prize: round(web3.utils.fromWei(new BN(_prize, 16)), 8),
            bombCost: round(web3.utils.fromWei(new BN(_bombCost, 16)), 8),
            joinTimeoutBlocks: (new BN(_joinTimeoutBlocks, 16)).toNumber(),
            revealTimeoutBlocks: (new BN(_revealTimeoutBlocks, 16)).toNumber(),
        };
        values.joinTimeoutBlockNumber = event.blockNumber + values.joinTimeoutBlocks;
    }

    if (eventName === BOMBS_PLACED) {
        const { _bomber, _bombsBoard, _paidBombsCost } = eventData;
        values = {
            status: GS.IN_PROGRESS,
            bombingTx: event.transactionHash,
            bomberAddr: _bomber,
            bombsBoard: BNToBoard(new BN(_bombsBoard, 16)),
            paidBombsCost: round(web3.utils.fromWei(new BN(_paidBombsCost, 16)), 8),
        }
    }
    if (eventName === SHIPS_REVEALED) {
        const { _ships, _sunkenShipsCount } = eventData;
        values = { 'revealedData.ships': _ships, sunkenShipsCount: _sunkenShipsCount };
    }
    if (eventName === GAME_FINISHED) {
        const { _creatorTransferAmount, _bomberTransferAmount } = eventData;
        values = {
            status: GS.FINISHED,
            creatorClaimAmount: round(web3.utils.fromWei(_creatorTransferAmount), 8),
            bomberClaimAmount: round(web3.utils.fromWei(_bomberTransferAmount), 8),
            finishingTx: event.transactionHash,
        };
    }

    if (eventName === JOIN_TIMEOUT) {
        values = { claimReason: 'Join Timeout' };
    }

    if (eventName === REVEAL_TIMEOUT) {
        values = { claimReason: 'Reveal Timeout' };
    }

    return values;
}

const recreateCachedGame = async (gameIndex) => {
    let events = await CachedEvent.find({ gameIndex }).sort({ blockNumber: 1, transactionIndex: 1, logIndex: 1 });
    if (events.length) {
        let valuesToSet = {};
        for (let event of events) {
            let eventValues = getValuesByEvent(event);
            if (event.eventName === BOMBS_PLACED) {
                eventValues.revealTimeoutBlockNumber = event.blockNumber + valuesToSet.revealTimeoutBlocks;
            }
            valuesToSet = {...valuesToSet, ...eventValues };
        }
        if (valuesToSet.revealedData) {
            await RevealedData.findOneAndUpdate(
                { gameIndex },
                { $set: {...valuesToSet.revealedData} }
            );
            delete valuesToSet.revealedData;
        }
        let gameUpdateObj = (new CachedGame(valuesToSet)).toObject(); // Get defaults etc.
        delete gameUpdateObj._id;
        // Handling the case where game of given index may have different creation hash due to reorg
        const currentRevealedData = await RevealedData.findOne({ gameIndex });
        if (gameUpdateObj.creationHash && currentRevealedData) {
            const { ships, seed } = currentRevealedData;
            const seedHash = '0x'+calcGameHash(ships, seed).toString('hex');
            if (seedHash !== valuesToSet.creationHash) {
                await RevealedData.deleteOne({ gameIndex });
            }
        }
        // Updating/Creating game
        await CachedGame.findOneAndUpdate(
            { gameIndex },
            { $set: { ...gameUpdateObj }, lastEventBlock: events[events.length - 1].blockNumber },
            { upsert: true }
        );
    } else {
        await CachedGame.deleteOne({ gameIndex });
    }
}

const createEventObject = (event) => {
    const { event: eventName, blockHash, transactionHash, transactionIndex, logIndex, blockNumber, args: data } = event;
    const gameIndex = data._gameIndex.toNumber();
    return {
        eventName,
        uniqueIdentifier: getEventIdentifier(event),
        gameIndex,
        blockHash,
        transactionHash,
        transactionIndex,
        logIndex,
        blockNumber,
        dataJSON: JSON.stringify(data)
    };
}

const handleNewEvent = async (event) => {
    if (!isGameEvent(event)) return;
    const { event: eventName } = event;
    const uniqueIdentifier = getEventIdentifier(event);
    const gameIndex = event.args._gameIndex.toNumber();
    console.log(`Handling event ${ eventName } for game #${ gameIndex }`);
    // Skip if we already have event with same identifier in db
    if (await CachedEvent.findOne({ uniqueIdentifier }).select('_id').lean()) {
        console.log('Event already handled, skipping...');
        return;
    }
    let cachedEvent = new CachedEvent(createEventObject(event));
    await cachedEvent.save();
    await recreateCachedGame(gameIndex);
};

const handleEventRemoval = async (event) => {
    if (!event.removed || !isGameEvent(event)) return; // event.removed should be set according to the doc
    const eventIdentifier = getEventIdentifier(event);
    await CachedEvent.deleteOne({ eventIdentifier });
    await recreateCachedGame(event.args._gameIndex);
};

const refreshCache = async (events) => {
    let allGameEventsIds = [], allGamesIndexes = [];
    for (let event of events) {
        if (!isGameEvent(event)) continue;
        handleNewEvent(event);
        const eventIdentifier = getEventIdentifier(event);
        const gameIndex = event.args._gameIndex.toNumber();
        allGameEventsIds.push(eventIdentifier);
        if (!allGamesIndexes.includes(gameIndex)) {
            allGamesIndexes.push(gameIndex);
        }
    }
    await CachedEvent.deleteMany({ uniqueIdentifier: { $nin: allGameEventsIds } });
    await CachedGame.deleteMany({ gameIndex: { $nin: allGamesIndexes } });
    for (let gameIndex of allGamesIndexes) await recreateCachedGame(gameIndex);
}

async function restartCacheGenerator() {
    console.log('CACHE RESTART TRIGGERED');

    if (MainSubscription) {
        console.log('Removing old listeners...');
        MainSubscription.removeAllListeners();
    }

    console.log('Getting deployed main contract instance...')
    const MainContract = TruffleContract(MainContractAbi);
    MainContract.setProvider(config.web3Provider);
    const MainContractInstance = await MainContract.deployed();

    console.log('Getting past events...');
    let currentBlock = await web3.eth.getBlockNumber();
    const events = await MainContractInstance.getPastEvents('allEvents', { fromBlock: 0 });

    console.log('Current block:', currentBlock);
    console.log('Past events found:', events.length);
    console.log('Refreshing cache...');
    await refreshCache(events);

    console.log('Starting/restarting events subscription...');
    currentBlock = await web3.eth.getBlockNumber();
    MainSubscription = MainContractInstance.allEvents({ fromBlock: Math.max(0, currentBlock - SAFE_CONFRIMATION_BLOCKS) })
        .on('data', handleNewEvent)
        .on('changed', handleEventRemoval)
        .on('error', console.error);
}

module.exports = { restartCacheGenerator };