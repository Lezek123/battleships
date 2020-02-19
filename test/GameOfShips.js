const MainContract = artifacts.require("GameOfShips.sol");
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
const timestamp = () => parseInt(Date.now() / 1000);
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

it('Should have correct balance on init', async function() {
    console.log('START VALUE:', START_VALUE.toString());
    const shipsBuffer = shipsToBuffer(SHIPS);
    const MainContractInstance = await MainContract.new(
        sha256(shipsBuffer), // creation hash
        BOMB_COST, // bomb cost
        timestamp(), // timeout,
        { value: START_VALUE }
    );
    const balance = await web3.eth.getBalance(MainContractInstance.address);

    assert.equal(balance, START_VALUE, 'Contract address balance does not equal initial value!');
});

it('Should disallow placing bombs if not enough wei sent', async function() {
    const shipsBuffer = shipsToBuffer(SHIPS);
    const MainContractInstance = await MainContract.new(
        sha256(shipsBuffer), // creation hash
        BOMB_COST, // bomb cost
        timestamp(), // timeout,
        { value: START_VALUE }
    );
    await truffleAssert.reverts(
        MainContractInstance.setBombs(
            BOMBS,
            { value: countPlacedBombs(BOMBS) * BOMB_COST - 1 }
        ),
        'Not enough wei sent.'
    );
});

it('Should disallow placing bombs twice', async function() {
    const shipsBuffer = shipsToBuffer(SHIPS);
    const MainContractInstance = await MainContract.new(
        sha256(shipsBuffer), // creation hash
        BOMB_COST, // bomb cost
        timestamp(), // timeout,
        { value: START_VALUE }
    );
    await MainContractInstance.setBombs(
        BOMBS,
        { value: countPlacedBombs(BOMBS) * BOMB_COST }
    );
    await truffleAssert.reverts(
        MainContractInstance.setBombs(
            BOMBS,
            { value: countPlacedBombs(BOMBS) * BOMB_COST }
        ),
        'Bomber already defined.'
    );
});


it('Should disallow bomber claim before timeout.', async function() {
    const shipsBuffer = shipsToBuffer(SHIPS);
    const TIMEOUT = timestamp() + 5;
    const BOBMS_COST = countPlacedBombs(BOMBS) * BOMB_COST;

    const MainContractInstance = await MainContract.new(
        sha256(shipsBuffer), // creation hash
        BOMB_COST, // bomb cost
        TIMEOUT, // timeout,
        { value: START_VALUE }
    );
    await MainContractInstance.setBombs(
        BOMBS,
        { value: BOBMS_COST }
    );
    await truffleAssert.reverts(MainContractInstance.claimBomberWin(), 'Timeout not reached yet.');
    assert.ok(timestamp() <= TIMEOUT, 'Test took too much time... Try again!');

    const balance = await web3.eth.getBalance(MainContractInstance.address);
    assert.equal(balance, parseInt(START_VALUE) + BOBMS_COST, 'Balance has changed!');
});



/*
const script = async () => {
    try {
        

        console.log('Game timeout:', TIMEOUT);
        console.log('Ships buffer:', shipsBuffer);

        try {

        } catch (e) {
            console.log('ERROR DURING CONTRACT CREATION!');
            console.log(e);
            return; // We can't do anything at this point...
        }
        
        try {
            await MainContractInstance.setBombs(
                BOMBS,
                // Transaction data...
                { value: BOMB_COST * 100 }
            );
        } catch(e) {
            console.log('ERROR WHILE SETTING BOMBS!');
            console.log(e);
        }
        
        let balanceBeforeClaim = await MainContractInstance.getBalance();
        console.log('Balance before claim: ', balanceBeforeClaim.toNumber());
        
        try {
            await MainContractInstance.claimCreatorWin(SHIPS, Buffer.from(SEED, 'ascii'));
        } catch(e) {
            console.log('CREATOR CLAIM FAILED!');
        }

        let balanceAfterCreatorClaim = await MainContractInstance.getBalance();
        console.log('Balance after creator claim:', balanceAfterCreatorClaim.toNumber());
        assert.equal(balanceAfterCreatorClaim.toNumber(), 0, 'Balance after creator claim is not right!');

        try {
            await MainContractInstance.claimBomberWin();
        } catch(e) {
            console.log('BOMBER CLAIM FAILED!');
        }

        let balanceAfterBomberClaim = await MainContractInstance.getBalance();
        console.log('Balance after bomber claim:', balanceAfterBomberClaim.toNumber());
    } catch(e) {
        console.log('UNEXPECTED ERROR!');
        console.log(e);
    }
}

module.exports = script;
*/