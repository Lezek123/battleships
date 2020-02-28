const shipsToArrShips = (ships) => ships.map(
    ({ x, y, vertical }) => [x, y, vertical]
);

module.exports = { shipsToArrShips };