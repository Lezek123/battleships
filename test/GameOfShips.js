const GameContract = artifacts.require("GameOfShips.sol");
const FactoryContract = artifacts.require("GameOfShipsFactory.sol");
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
    const FactoryInstance = await FactoryContract.deployed();
    const result = await FactoryInstance.createGame(
        calcGameHash(ships, seed),
        bombCost,
        revealTimeoutBlocks,
        joinTimeoutBlocks,
        { value: initValue }
    );
    const gameAddress = result.logs[0].args._gameAddress;
    return await GameContract.at(gameAddress);
}

const placeValidBombs = async (gameContract, bombs = DEFAULT_BOMBS) => {
    const bombCost = await gameContract.bombCost();
    return await gameContract.setBombs(
        bombs,
        { value: countPlacedBombs(bombs) * bombCost }
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
    let game = await initGameContract();
    assert.ok(game instanceof GameContract, 'Game is not instance of GameContract!');
});

it('Should have correct balance on init', async function() {
    const game = await initGameContract();
    const balance = await web3.eth.getBalance(game.address);

    assert.equal(balance, DEFAULT_INIT_VALUE, 'Contract address balance does not equal initial value!');
});

it('Should disallow placing bombs if not enough wei sent', async function() {
    const game = await initGameContract();
    await truffleAssert.reverts(
        game.setBombs(
            DEFAULT_BOMBS,
            { value: countPlacedBombs(DEFAULT_BOMBS) * DEFAULT_BOMB_COST - 1 }
        ),
        'Not enough wei sent.'
    );
});

it('Should disallow placing bombs twice', async function() {
    const game = await initGameContract();
    await placeValidBombs(game);
    await truffleAssert.reverts(placeValidBombs(game), 'Bomber already defined.');
});


it('Should disallow bomber claim before timeout.', async function() {
    const game = await initGameContract();
    await placeValidBombs(game);
    await truffleAssert.reverts(game.claimBomberWin(), 'Timeout not reached yet.');

    const bombsCost = countPlacedBombs(DEFAULT_BOMBS) * DEFAULT_BOMB_COST;
    const balance = await web3.eth.getBalance(game.address);
    assert.equal(balance, parseInt(DEFAULT_INIT_VALUE) + bombsCost, 'Balance has changed!');
});

it('Should disallow creator claim if he lost', async function() {
    const game = await initGameContract();
    // Place bombs
    await placeValidBombs(game);
    await truffleAssert.reverts(game.claimCreatorWin(shipsToArrShips(DEFAULT_SHIPS), DEFAULT_SEED), 'Creator is not a winner.');

    const bombsCost = countPlacedBombs(DEFAULT_BOMBS) * DEFAULT_BOMB_COST;
    const balance = await web3.eth.getBalance(game.address);
    assert.equal(balance, parseInt(DEFAULT_INIT_VALUE) + bombsCost, 'Balance has changed!');
});

it('Should allow creator claim if he won', async function() {
    const game = await initGameContract();
    // Place bombs
    await placeValidBombs(game, LOSING_BOMBS);
    await game.claimCreatorWin(shipsToArrShips(DEFAULT_SHIPS), DEFAULT_SEED);

    const balance = await web3.eth.getBalance(game.address);
    assert.equal(balance, 0, 'Contract balance was not cleared!');
});

it('Should disallow caliming join timeout return before timeout.', async function() {
    const game = await initGameContract();
    await truffleAssert.reverts(game.claimJoinTimeoutReturn(), 'Timeout not reached yet.');
});

it('Should disallow caliming join timeout return after the game has started.', async function() {
    this.timeout(60000);

    const game = await initGameContract();
    const currentBlockNumber = parseInt(await web3.eth.getBlockNumber());
    const joinTimeoutBlockNumber = parseInt(await game.joinTimeoutBlockNumber());

    assert.equal(joinTimeoutBlockNumber, currentBlockNumber + DEFAULT_JOIN_TIMEOUT_BLOCKS);
    // Wait until the timeout
    await untilBlock(joinTimeoutBlockNumber + 1);
    // Place bombs
    await game.setBombs(
        DEFAULT_BOMBS,
        { value: countPlacedBombs(DEFAULT_BOMBS) * DEFAULT_BOMB_COST }
    );

    await truffleAssert.reverts(game.claimJoinTimeoutReturn(), 'The game already started.');
});

it('Should disallow placing less than 25 bombs', async function() {
    const game = await initGameContract();
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
        game.setBombs(bombsBoard, { value: 24 * DEFAULT_BOMB_COST }),
        'You need to place at least 25 bombs.'
    );
});