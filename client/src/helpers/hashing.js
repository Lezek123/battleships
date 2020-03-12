import crypto from 'crypto';
import { shipsToArrShips } from './converters';

export const sha256 = (value) => crypto.createHash('sha256').update(value).digest();
export const calcGameHash = (ships, seed) => sha256(
    Buffer.concat(shipsToArrShips(ships).map(shipArr => Buffer.from(shipArr)).concat([seed]))
);