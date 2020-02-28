const crypto = require('crypto');
const { shipsToArrShips } = require('./converters');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest();
const calcGameHash = (ships, seed) => {
    const arrShips = shipsToArrShips(ships);
    const buff = Buffer.concat([ ...arrShips.map(shipArr => Buffer.from(shipArr)), Buffer.from(seed)]);
    return sha256(buff);
}

module.exports = { sha256, calcGameHash };