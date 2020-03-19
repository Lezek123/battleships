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

const BNToBoard = (bn) => {
    if (!bn) return null;
    const bitsStr = bn.toString(2);
    const flattenBoard = bitsStr.split('').map(b => b === '1').reverse();
    while (flattenBoard.length < 100) flattenBoard.push(false);
    return Array.from(Array(10)).map((row, y) => flattenBoard.slice(y*10, (y+1)*10));
}

module.exports = { shipsToArrShips, boardToBN, BNToBoard };