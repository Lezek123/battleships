const MainContract = artifacts.require("GameOfShips.sol");
const crypto = require('crypto');
const assert = require('assert');
const truffleAssert = require('truffle-assertions');
const BN = web3.utils.BN;
const { calcGameHash } = require('../helpers/hashing');
const { shipsToArrShips } = require('../helpers/converters');

// Defaults
const DEFAULT_INIT_VALUE = web3.utils.toWei('0.001', 'ether');
const DEFAULT_BOMB_COST = web3.utils.toWei('0.00002', 'ether');
const DEFAULT_JOIN_TIMEOUT_BLOCKS = 10;
const DEFAULT_REVEAL_TIMEOUT_BLOCKS = 10;
const DEFAULT_SEED = Buffer.from(
    Array.from(Array(32)).map(() => Math.floor(Math.random() * 255))
);

const DEFAULT_SHIPS = [
    { y: 0, x: 0, vertical: true },
    { y: 9, x: 0, vertical: false },
    { y: 0, x: 5, vertical: false },
    { y: 1, x: 5, vertical: false },
    { y: 2, x: 5, vertical: false }
];

const DEFAULT_BOMBS = [
    [1, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
];

const LOSING_BOMBS = [
    [1, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1, 0, 0, 0, 0, 1],
]

// Functions
const countPlacedBombs = (bombs) => {
    return bombs.reduce((a, b) => a + b.filter(bomb => bomb).length, 0);
}

const initGameContract = async (
    initValue = DEFAULT_INIT_VALUE,
    bombCost = DEFAULT_BOMB_COST,
    revealTimeoutBlocks = DEFAULT_REVEAL_TIMEOUT_BLOCKS,
    joinTimeoutBlocks = DEFAULT_JOIN_TIMEOUT_BLOCKS,
    ships = DEFAULT_SHIPS,
    seed = DEFAULT_SEED
) => {
    const MainInstance = await MainContract.deployed();
    const result = await MainInstance.createGame(
        calcGameHash(ships, seed),
        bombCost,
        revealTimeoutBlocks,
        joinTimeoutBlocks,
        { value: initValue }
    );
    return result.logs[0].args._gameIndex;
}

const placeBombsWithValidCost = async (gameIndex, bombs = DEFAULT_BOMBS) => {
    const MainInstance = await MainContract.deployed();
    const game = await MainInstance.games(gameIndex);

    return await MainInstance.setBombs(
        gameIndex,
        bombs,
        { value: countPlacedBombs(bombs) * game.bombCost }
    );
}

// Wait / skip until given block number is reached (use like: await untilBlock(10))
const untilBlock = (expectedBlockNumber, timeoutSec = 60) => new Promise(async (resolve, reject) => {
    let timeout = setTimeout(() => { reject('Timeout'); }, timeoutSec * 1000);
    let accounts = await web3.eth.getAccounts();
    let interval = setInterval(
        async () => {
            let currentBlockNumber = parseInt(await web3.eth.getBlockNumber());
            if (currentBlockNumber < expectedBlockNumber) {
                await web3.eth.sendTransaction({
                    from: accounts[0],
                    to: accounts[1]
                });
            }
            else {
                clearInterval(interval);
                clearTimeout(timeout);
                resolve();
            }
        },
        100
    );
});

// TESTS
it("Should be creatable", async function() {
    let gameIndex = await initGameContract();
    assert.ok(gameIndex, 'No game index returned!');
});

it('Should be fetchable and have correct params after init', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    const game = await MainInstance.games(gameIndex);
    assert.equal(game.prize, DEFAULT_INIT_VALUE);
    assert.equal(game.bombCost, DEFAULT_BOMB_COST);
    assert.equal(game.revealTimeoutBlocks, DEFAULT_REVEAL_TIMEOUT_BLOCKS);
});

it('Should disallow placing bombs if not enough wei sent', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    await truffleAssert.reverts(
        MainInstance.setBombs(
            gameIndex,
            DEFAULT_BOMBS,
            { value: countPlacedBombs(DEFAULT_BOMBS) * DEFAULT_BOMB_COST - 1 }
        ),
        'Not enough wei sent.'
    );
});

// TODO: Should allow placing correct bombs + emit "bombs placed"

it('Should disallow placing bombs twice', async function() {
    const gameIndex = await initGameContract();
    await placeBombsWithValidCost(gameIndex);
    await truffleAssert.reverts(placeBombsWithValidCost(gameIndex), 'Bomber already defined.');
});


it('Should disallow bomber claim before timeout.', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    await placeBombsWithValidCost(gameIndex);
    await truffleAssert.reverts(MainInstance.claimBomberWin(gameIndex), 'Timeout not reached yet.');
});

it('Should disallow creator claim if he lost', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    // Place bombs
    await placeBombsWithValidCost(gameIndex);
    await truffleAssert.reverts(
        MainInstance.claimCreatorWin(gameIndex, shipsToArrShips(DEFAULT_SHIPS), DEFAULT_SEED),
        'Creator is not a winner.'
    );
});

it('Should allow creator claim if he won', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    // Place bombs
    await placeBombsWithValidCost(gameIndex, LOSING_BOMBS);
    await MainInstance.claimCreatorWin(gameIndex, shipsToArrShips(DEFAULT_SHIPS), DEFAULT_SEED);
    // TODO: Some additional asserts
});

it('Should disallow caliming join timeout return before timeout.', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    await truffleAssert.reverts(MainInstance.claimJoinTimeoutReturn(gameIndex), 'Timeout not reached yet.');
});

it('Should disallow caliming join timeout return after the game has started.', async function() {
    this.timeout(60000);

    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    const game = await MainInstance.games(gameIndex);

    const currentBlockNumber = parseInt(await web3.eth.getBlockNumber());
    const joinTimeoutBlockNumber = parseInt(game.joinTimeoutBlockNumber);

    assert.equal(joinTimeoutBlockNumber, currentBlockNumber + DEFAULT_JOIN_TIMEOUT_BLOCKS);
    // Wait until the timeout
    await untilBlock(joinTimeoutBlockNumber + 1);
    // Place bombs
    await MainInstance.setBombs(
        gameIndex,
        DEFAULT_BOMBS,
        { value: countPlacedBombs(DEFAULT_BOMBS) * DEFAULT_BOMB_COST }
    );

    await truffleAssert.reverts(MainInstance.claimJoinTimeoutReturn(gameIndex), 'The game already started.');
});

it('Should disallow placing less than 25 bombs', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    // Create 2-dimensional array of "false"
    const bombsBoard = Array.from(Array(10)).map(() => Array.from(Array(10)).map(() => false));
    // Place 24 bombs randomly on the board
    for (i=0; i<24; ++i) {
        let x, y;
        do {
            x = Math.floor(Math.random() * 10);
            y = Math.floor(Math.random() * 10);
        } while (bombsBoard[y][x]);
        bombsBoard[y][x] = true;
    }

    await truffleAssert.reverts(
        MainInstance.setBombs(gameIndex, bombsBoard, { value: DEFAULT_BOMB_COST * 24 }),
        'You need to place at least 25 bombs.'
    );
});