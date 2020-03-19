const
    Web3 = require('web3'),
    { BN } = Web3.utils,
    mongoose = require('mongoose'),
    config = require('./config/config'),
    TruffleContract = require('@truffle/contract'),
    MainContractAbi = require('./build/contracts/GameOfShips.json'),
    CachedGame = mongoose.model('cachedGame'),
    CachedEvent = mongoose.model('cachedEvent'),
    { GAME_CREATED, BOMBS_PLACED, SHIPS_REVEALED, GAME_FINISHED } = require('./constants/events'),
    GS = require('./constants/gameStatuses'),
    { sha256 } = require('./helpers/hashing'),
    { BNToBoard } = require('./helpers/converters'),
    { SAFE_CONFRIMATION_BLOCKS } = require('./constants/blockchain'),
    { round } = require('./helpers/math');

const web3 = new Web3();
web3.setProvider(config.web3Provider);

function getValuesByEvent(event) {
    let values = {};

    const { eventName, dataJSON } = event;
    const eventData = JSON.parse(dataJSON);

    if (eventName === GAME_CREATED) {
        const { _creator, _creationHash, _prize, _bombCost, _joinTimeoutBlocks, _revealTimeoutBlocks } = eventData;
        values = {
            status: GS.NEW,
            creatorAddr: _creator,
            creationHash: _creationHash,
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
            bomberAddr: _bomber,
            bombsBoard: BNToBoard(new BN(_bombsBoard, 16)),
            paidBombsCost: round(web3.utils.fromWei(new BN(_paidBombsCost, 16)), 8),
        }
    }
    if (eventName === SHIPS_REVEALED) {
        const { _ships } = eventData;
        values = { 'revealedData.ships': _ships };
    }
    if (eventName === GAME_FINISHED) {
        values = { status: GS.FINISHED };
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
        let game = (new CachedGame(valuesToSet)).toObject(); // Get defaults etc.
        delete game.revealedData;
        delete game._id;
        await CachedGame.findOneAndUpdate(
            { gameIndex },
            { $set: { ...game }, lastEventBlock: events[events.length - 1].blockNumber },
            { upsert: true }
        );
    } else {
        await CachedGame.deleteOne({ gameIndex });
    }
}

const handleNewEvent = async (event) => {
    const { event: eventName, blockHash, transactionHash, transactionIndex, logIndex, blockNumber, args: data } = event;
    const uniqueIdentifier = sha256(blockHash + transactionHash + logIndex).toString('hex');
    const gameIndex = data._gameIndex.toNumber();
    console.log(`Handling event ${ eventName } for game #${ gameIndex }`);
    // Skip if we already have event with same identifier in db
    if (await CachedEvent.findOne({ uniqueIdentifier }).select('_id').lean()) {
        console.log('Event already handled, skipping...');
        return;
    }
    let cachedEvent = new CachedEvent({
        eventName,
        uniqueIdentifier,
        gameIndex,
        blockHash,
        transactionHash,
        transactionIndex,
        logIndex,
        blockNumber,
        dataJSON: JSON.stringify(data)
    });
    await cachedEvent.save();
    await recreateCachedGame(gameIndex);
};

const handleEventRemoval = async (event) => {
    if (!event.removed) return; // It should be set according to the doc
    const { blockHash, transactionHash, logIndex } = event;
    const eventIdentifier = sha256(blockHash + transactionHash + logIndex);
    await CachedEvent.deleteOne({ eventIdentifier });
    await recreateCachedGame(event.args._gameIndex);
};

async function initBlockchainConnection() {
    console.log('Initializing connection between server and the blockchain...');

    console.log('Removing old cached data...');
    await CachedEvent.deleteMany({});
    await CachedGame.deleteMany({});

    console.log('Getting deployed main contract instance...')
    const MainContract = TruffleContract(MainContractAbi);
    MainContract.setProvider(config.web3Provider);
    const MainContractInstance = await MainContract.deployed();

    console.log('Getting past events...');
    const currentBlock = await web3.eth.getBlockNumber();
    const events = await MainContractInstance.getPastEvents('allEvents', { fromBlock: 0 });
    console.log('Current block:', currentBlock);
    console.log('Past events found:', events.length);
    for (let event of events) {
        await handleNewEvent(event);
    }
    console.log('Starting events subscription...');
    MainContractInstance.allEvents({ fromBlock: Math.max(0, currentBlock - SAFE_CONFRIMATION_BLOCKS) })
        .on('data', handleNewEvent)
        .on('changed', handleEventRemoval);
}

module.exports = initBlockchainConnection;