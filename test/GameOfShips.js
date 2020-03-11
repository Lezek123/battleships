const MainContract = artifacts.require("GameOfShips.sol");
const crypto = require('crypto');
const assert = require('assert');
const truffleAssert = require('truffle-assertions');
const { calcGameHash } = require('../helpers/hashing');
const { shipsToArrShips, boardToBN } = require('../helpers/converters');
const BigNumber = web3.utils.BN;

// Wheter to log action costs during tests
const LOG_COSTS = false;

const generateRandomSeed = () => Buffer.from(
    Array.from(Array(32)).map(() => Math.floor(Math.random() * 255))
);
// Defaults
const DEFAULT_INIT_VALUE = web3.utils.toWei('0.001', 'ether');
const DEFAULT_BOMB_COST = web3.utils.toWei('0.00002', 'ether');
const DEFAULT_JOIN_TIMEOUT_BLOCKS = 10;
const DEFAULT_REVEAL_TIMEOUT_BLOCKS = 10;
const DEFAULT_SEED = generateRandomSeed();

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
];


const getDefaultCreatorAddress = async () => {
    let accounts = await web3.eth.getAccounts();
    return accounts[1];
}

const getDefaultBomberAddress = async () => {
    let accounts = await web3.eth.getAccounts();
    return accounts[2];
}

// Functions
const logTransactionCost = (transcationDesc, result) => {
    if (!LOG_COSTS) return;
    const { gasUsed } = result.receipt;
    const costEth = web3.utils.fromWei((gasUsed * 1000000000).toString());
    const costFiat = Math.round(costEth * 200 * 100) / 100; 
    console.log(
        `${ transcationDesc }`,
        `\nGas used: ${ gasUsed }`, 
        `\nEstimated costs (10 Gwei per gas and $200 per ETH):`,
        `${ costEth } ETH (~$${ costFiat })\n`
    );
}

const countPlacedBombs = (bombs) => {
    return bombs.reduce((a, b) => a + b.filter(bomb => bomb).length, 0);
}

const initGameContract = async (props = {}) => {
    let {
        initValue = DEFAULT_INIT_VALUE,
        bombCost = DEFAULT_BOMB_COST,
        revealTimeoutBlocks = DEFAULT_REVEAL_TIMEOUT_BLOCKS,
        joinTimeoutBlocks = DEFAULT_JOIN_TIMEOUT_BLOCKS,
        ships = DEFAULT_SHIPS,
        seed = DEFAULT_SEED
    } = props;
    const MainInstance = await MainContract.deployed();
    const result = await MainInstance.createGame(
        calcGameHash(ships, seed),
        bombCost,
        revealTimeoutBlocks,
        joinTimeoutBlocks,
        { value: initValue, from: await getDefaultCreatorAddress() }
    );
    logTransactionCost('Game creation', result);
    return result.logs[0].args._gameIndex;
}

const placeBombsWithValidCost = async (gameIndex, bombs = DEFAULT_BOMBS) => {
    const MainInstance = await MainContract.deployed();
    const game = await MainInstance.games(gameIndex);

    const result = await MainInstance.setBombs(
        gameIndex,
        boardToBN(bombs),
        { value: countPlacedBombs(bombs) * game.bombCost, from: await getDefaultBomberAddress() }
    );
    logTransactionCost('Bombs placement', result);
    return result;
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
            boardToBN(DEFAULT_BOMBS),
            { value: countPlacedBombs(DEFAULT_BOMBS) * DEFAULT_BOMB_COST - 1 }
        ),
        'Not enough wei sent.'
    );
});

it('Should emit "Bombs placed" event', async function() {
    const gameIndex = await initGameContract();
    let result = await placeBombsWithValidCost(gameIndex);
    
    const bomberAddress = await getDefaultBomberAddress();

    assert.ok(result.logs && result.logs[0]);
    assert.equal(result.logs[0].event, 'BombsPlaced');
    assert.equal(result.logs[0].args._bomber, bomberAddress);
});

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

it('Should correctly handle bomber timeout claim if valid', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    await placeBombsWithValidCost(gameIndex);

    const game = await MainInstance.games(gameIndex);
    await untilBlock(game.revealTimeoutBlockNumber.toNumber());

    const bomberAddress = await getDefaultBomberAddress();
    const bomberBalanceBeforeClaim = web3.utils.toBN(await web3.eth.getBalance(bomberAddress));
    await MainInstance.claimBomberWin(gameIndex);
    const bomberBalanceAfterClaim = web3.utils.toBN(await web3.eth.getBalance(bomberAddress));
    const expectedBalance = bomberBalanceBeforeClaim.add(web3.utils.toBN(DEFAULT_INIT_VALUE));

    assert.strictEqual(bomberBalanceAfterClaim.toString(), expectedBalance.toString());
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

it('Should disallow creator claim if seed is incorrect', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    await placeBombsWithValidCost(gameIndex, LOSING_BOMBS);
    const skewedSeed = generateRandomSeed();
    await truffleAssert.reverts(
        MainInstance.claimCreatorWin(gameIndex, shipsToArrShips(DEFAULT_SHIPS), skewedSeed),
        'Invalid hash provided.'
    );
});

it('Should disallow creator claim if ships positions are changed', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    await placeBombsWithValidCost(gameIndex, LOSING_BOMBS);
    let skewedShips = [...DEFAULT_SHIPS];
    skewedShips.splice(0, 1, { x: 0, y: 0, vertical: false });
    await truffleAssert.reverts(
        MainInstance.claimCreatorWin(gameIndex, shipsToArrShips(skewedShips), DEFAULT_SEED),
        'Invalid hash provided.'
    );
});

it('Should disallow creator claim if game was skewed with not enough ships', async function() {
    let skewedShips = [...DEFAULT_SHIPS];
    skewedShips.splice(0, 1);
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract({ ships: skewedShips });
    await placeBombsWithValidCost(gameIndex, LOSING_BOMBS);;
    await truffleAssert.fails(
        MainInstance.claimCreatorWin(gameIndex, shipsToArrShips(skewedShips), DEFAULT_SEED)
    );
});

it('Should disallow creator claim if game was skewed with invalid vertical ship', async function() {
    let skewedShips = [...DEFAULT_SHIPS];
    skewedShips.splice(0, 1, { y: 7, x: 0, vertical: true });
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract({ ships: skewedShips });
    await placeBombsWithValidCost(gameIndex, LOSING_BOMBS);
    await truffleAssert.reverts(
        MainInstance.claimCreatorWin(gameIndex, shipsToArrShips(skewedShips), DEFAULT_SEED),
        'Invalid ship placement.'
    );
});

it('Should disallow creator claim if game was skewed with invalid horizontal ship', async function() {
    let skewedShips = [...DEFAULT_SHIPS];
    skewedShips.splice(0, 1, { y: 0, x: 7, horizontal: true });
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract({ ships: skewedShips });
    await placeBombsWithValidCost(gameIndex, LOSING_BOMBS);
    await truffleAssert.reverts(
        MainInstance.claimCreatorWin(gameIndex, shipsToArrShips(skewedShips), DEFAULT_SEED),
        'Invalid ship placement.'
    );
});

it('Should disallow creator claim if game was skewed with overlaying ships', async function() {
    let skewedShips = [...DEFAULT_SHIPS];
    skewedShips.splice(
        0,
        2,
        { y: 0, x: 0, horizontal: true },
        { y: 0, x: 4, horizontal: true },
    );
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract({ ships: skewedShips });
    await placeBombsWithValidCost(gameIndex, LOSING_BOMBS);
    await truffleAssert.reverts(
        MainInstance.claimCreatorWin(gameIndex, shipsToArrShips(skewedShips), DEFAULT_SEED),
        'Placed ships cannot overlay!'
    );
});

it('Should allow valid creator claim', async function() {
    const MainInstance = await MainContract.deployed();
    const gameIndex = await initGameContract();
    // Place bombs
    await placeBombsWithValidCost(gameIndex, LOSING_BOMBS);
    
    const creatorAddress = await getDefaultCreatorAddress();
    const creatorBalanceBeforeClaim = web3.utils.toBN(await web3.eth.getBalance(creatorAddress));
    const result = await MainInstance.claimCreatorWin(gameIndex, shipsToArrShips(DEFAULT_SHIPS), DEFAULT_SEED);
    const creatorBalanceAfterClaim = web3.utils.toBN(await web3.eth.getBalance(creatorAddress));
    const placedBombsCount = web3.utils.toBN(countPlacedBombs(LOSING_BOMBS));
    const placedBombsCost = web3.utils.toBN(DEFAULT_BOMB_COST).mul(placedBombsCount);

    const expectedBalance = creatorBalanceBeforeClaim
        .add(web3.utils.toBN(DEFAULT_INIT_VALUE))
        .add(placedBombsCost);

    console.log(expectedBalance.toString());
    assert.strictEqual(creatorBalanceAfterClaim.toString(), expectedBalance.toString());

    logTransactionCost('Creator claim', result);
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
        boardToBN(DEFAULT_BOMBS),
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
        MainInstance.setBombs(gameIndex, boardToBN(bombsBoard), { value: DEFAULT_BOMB_COST * 24 }),
        'You need to place at least 25 bombs.'
    );
});