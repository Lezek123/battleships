const web3 = require('web3');
const BigNumber = web3.utils.BN;

const shipsToArrShips = (ships) => ships.map(
    ({ x, y, vertical }) => [x, y, vertical]
);

const boardToBN = (bombsBoard) => {
    const flattenBoard = bombsBoard.reduce((arr, row) => arr.concat(row), []);
    const bits = flattenBoard.reverse();
    const bitsStr = bits.reduce((str, bit) => str += bit ? '1' : '0', '');
    return new BigNumber(bitsStr, 2);
}

module.exports = { shipsToArrShips, boardToBN };