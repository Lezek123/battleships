const GameContract = artifacts.require("GameOfShips.sol");
const FactoryContract = artifacts.require("GameOfShipsFactory.sol");
const crypto = require('crypto');
const assert = require('assert');
const truffleAssert = require('truffle-assertions');
const BN = web3.utils.BN;

const START_VALUE = web3.utils.toWei('0.001', 'ether');
const BOMB_COST = 1000; // 1000 wei
const SEED = 'sometestseed';
const SHIPS = [
    [0, 0, true],
    [9, 0, true],
    [0, 9, false],
    [0, 8, false],
    [0, 7, false]
];
const BOMBS = [
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
const sha256 = (string) => crypto.createHash('sha256').update(string).digest();
const shipsToBuffer = (ships, seed = SEED) => {
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

it("Should be creatable by factory", async function() {
    const shipsBuffer = shipsToBuffer(SHIPS);
    const FactoryInstance = await FactoryContract.deployed();
    const tx = await FactoryInstance.createGame(
        sha256(shipsBuffer), // creation hash
        BOMB_COST, // bomb cost
        10, // timeout in blocks,
        { value: START_VALUE }
    );
    truffleAssert.eventEmitted(tx, 'GameCreated');
});

it('Should have correct balance on init', async function() {
    const shipsBuffer = shipsToBuffer(SHIPS);
    const GameContractInstance = await GameContract.new(
        sha256(shipsBuffer), // creation hash
        BOMB_COST, // bomb cost
        10, // timeout in blocks,
        { value: START_VALUE }
    );
    const balance = await web3.eth.getBalance(GameContractInstance.address);

    assert.equal(balance, START_VALUE, 'Contract address balance does not equal initial value!');
});

it('Should disallow placing bombs if not enough wei sent', async function() {
    const shipsBuffer = shipsToBuffer(SHIPS);
    const GameContractInstance = await GameContract.new(
        sha256(shipsBuffer), // creation hash
        BOMB_COST, // bomb cost
        10, // timeout in blocks,
        { value: START_VALUE }
    );
    await truffleAssert.reverts(
        GameContractInstance.setBombs(
            BOMBS,
            { value: countPlacedBombs(BOMBS) * BOMB_COST - 1 }
        ),
        'Not enough wei sent.'
    );
});

it('Should disallow placing bombs twice', async function() {
    const shipsBuffer = shipsToBuffer(SHIPS);
    const GameContractInstance = await GameContract.new(
        sha256(shipsBuffer), // creation hash
        BOMB_COST, // bomb cost
        10, // timeout in blocks,
        { value: START_VALUE }
    );
    await GameContractInstance.setBombs(
        BOMBS,
        { value: countPlacedBombs(BOMBS) * BOMB_COST }
    );
    await truffleAssert.reverts(
        GameContractInstance.setBombs(
            BOMBS,
            { value: countPlacedBombs(BOMBS) * BOMB_COST }
        ),
        'Bomber already defined.'
    );
});


it('Should disallow bomber claim before timeout.', async function() {
    const shipsBuffer = shipsToBuffer(SHIPS);
    const BOBMS_COST = countPlacedBombs(BOMBS) * BOMB_COST;

    const GameContractInstance = await GameContract.new(
        sha256(shipsBuffer), // creation hash
        BOMB_COST, // bomb cost
        120, // timeout in blocks,
        { value: START_VALUE }
    );
    await GameContractInstance.setBombs(
        BOMBS,
        { value: BOBMS_COST }
    );
    await truffleAssert.reverts(GameContractInstance.claimBomberWin(), 'Timeout not reached yet.');

    const balance = await web3.eth.getBalance(GameContractInstance.address);
    assert.equal(balance, parseInt(START_VALUE) + BOBMS_COST, 'Balance has changed!');
});