export const shipsToBuffer = (ships, seed) => {
    let buffers = ships.map(ship => {
        let { x, y, vertical } = ship;
        return Buffer.from([x, y, vertical ? 1 : 0]);
    });
    buffers.push(Buffer.from(seed, 'ascii'));
    return Buffer.concat(buffers);
}