import Web3 from 'web3';
const BigNumber = Web3.utils.BN;

export const shipsToArrShips = (ships) => ships.map(
    ({ x, y, vertical }) => [x, y, vertical]
);

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

export const shipsToBoard = (ships) => {
    let placedFields = {};
    ships.forEach((ship) => {
        if (ship.vertical) for (let y = ship.y; y < ship.y + 4; ++y) placedFields[y*10 + ship.x] = true;
        else for (let x = ship.x; x < ship.x + 4; ++x) placedFields[ship.y*10 + x] = true;
    });
    return Array.from(Array(10)).map((row, y) =>
        Array.from(Array(10)).map((field, x) => Boolean(placedFields[y*10 + x]))
    );
}

export const secondsToStringInterval = (seconds, showSeconds = true) => {
    const intervalParts = {
        d: parseInt(seconds / (60 * 60 * 24)),
        h: parseInt(seconds / (60 * 60)) % 24,
        m: parseInt(seconds / 60) % 60,
        s: seconds % 60,
    }

    if (!seconds) return showSeconds ? '0s' : '0m';

    return Object.keys(intervalParts)
        .filter(key => (showSeconds || key !== 's') && intervalParts[key])
        .map(key => `${ intervalParts[key] }${ key }`)
        .join(' ');
}

export const AVG_BLOCK_TIME = 14;
export const blocksToRoundedInterval = (blocksCount, roundToMinutes = 5) => {
    let minutes = blocksCount * AVG_BLOCK_TIME / 60;
    let minutesRounded = Math.round(minutes / roundToMinutes) * roundToMinutes;

    if (!minutesRounded) return `<${roundToMinutes}m`;
    return `~${ secondsToStringInterval(minutesRounded * 60, 'm') }`;
}