import Web3 from 'web3';
const BigNumber = Web3.utils.BN;

export const shipsToBuffer = (ships, seed) => {
    let buffers = ships.map(ship => {
        let { x, y, vertical } = ship;
        return Buffer.from([x, y, vertical ? 1 : 0]);
    });
    buffers.push(seed);
    return Buffer.concat(buffers);
}

export const boardToBN = (board) => {
    const flattenBoard = board.reduce((arr, row) => arr.concat(row), []);
    const bits = flattenBoard.reverse();
    const bitsStr = bits.reduce((str, bit) => str += bit ? '1' : '0', '');
    return new BigNumber(bitsStr, 2);
}

export const BNToBoard = (bn) => {
    if (!bn) return null;
    const bitsStr = bn.toString(2);
    const flattenBoard = bitsStr.split('').map(b => b === '1').reverse();
    return Array.from(Array(10)).map((row, y) => flattenBoard.slice(y*10, (y+1)*10));
}

export const secondsToStringInterval = (seconds) => {
    const intervalParts = {
        d: parseInt(seconds / (60 * 60 * 24)),
        h: parseInt(seconds / (60 * 60)) % 24,
        m: parseInt(seconds / 60) % 60,
        s: seconds % 60,
    }

    return Object.keys(intervalParts)
        .filter(key => intervalParts[key])
        .map(key => `${ intervalParts[key] }${ key }`)
        .join(' ');
}