export const shipsToBuffer = (ships, seed) => {
    let buffers = ships.map(ship => {
        let { x, y, vertical } = ship;
        return Buffer.from([x, y, vertical ? 1 : 0]);
    });
    buffers.push(Buffer.from(seed, 'ascii'));
    return Buffer.concat(buffers);
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