const GameContract = artifacts.require("GameOfShips.sol");
const FactoryContract = artifacts.require("GameOfShipsFactory.sol");
const crypto = require('crypto');
const assert = require('assert');
const truffleAssert = require('truffle-assertions');
const BN = web3.utils.BN;

// Defaults
const DEFAULT_INIT_VALUE = web3.utils.toWei('0.001', 'ether');
const DEFAULT_BOMB_COST = web3.utils.toWei('0.00002', 'ether');
const DEFAULT_JOIN_TIMEOUT_BLOCKS = 10;
const DEFAULT_REVEAL_TIMEOUT_BLOCKS = 10;
const DEFAULT_SEED = 'sometestseed';
const DEFAULT_SHIPS = [
    [0, 0, true],
    [9, 0, true],
    [0, 9, false],
    [0, 8, false],
    [0, 7, false]
];
const DEFAULT_BOMBS = [
    [1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
];

// Functions
const sha256 = (string) => crypto.createHash('sha256').update(string).digest();

const shipsToBuffer = (ships, seed = DEFAULT_SEED) => {
    let buffers = ships.map(ship => {
        let [ beginX, beginY, vertical ] = ship;
        return Buffer.from([beginX, beginY, vertical ? 1 : 0]);
    });
    buffers.push(Buffer.from(seed, 'ascii'));
    return Buffer.concat(buffers);
}

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
    const shipsBuffer = shipsToBuffer(ships, seed);
    const FactoryInstance = await FactoryContract.deployed();
    const result = await FactoryInstance.createGame(
        sha256(shipsBuffer),
        bombCost,
        revealTimeoutBlocks,
        joinTimeoutBlocks,
        { value: initValue }
    );
    const gameAddress = result.logs[0].args._gameAddress;
    return await GameContract.at(gameAddress);
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
        1000
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
    await game.setBombs(
        DEFAULT_BOMBS,
        { value: countPlacedBombs(DEFAULT_BOMBS) * DEFAULT_BOMB_COST }
    );
    await truffleAssert.reverts(
        game.setBombs(
            DEFAULT_BOMBS,
            { value: countPlacedBombs(DEFAULT_BOMBS) * DEFAULT_BOMB_COST }
        ),
        'Bomber already defined.'
    );
});


it('Should disallow bomber claim before timeout.', async function() {
    const game = await initGameContract(DEFAULT_INIT_VALUE, DEFAULT_BOMB_COST, 120);

    let bombsCost = countPlacedBombs(DEFAULT_BOMBS) * DEFAULT_BOMB_COST;
    await game.setBombs(
        DEFAULT_BOMBS,
        { value: bombsCost }
    );
    await truffleAssert.reverts(game.claimBomberWin(), 'Timeout not reached yet.');

    const balance = await web3.eth.getBalance(game.address);
    assert.equal(balance, parseInt(DEFAULT_INIT_VALUE) + bombsCost, 'Balance has changed!');
});

it('Should disallow caliming join timeout return before timeout.', async function() {
    const game = await initGameContract(DEFAULT_INIT_VALUE, DEFAULT_BOMB_COST, 120);
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