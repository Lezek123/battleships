const GameOfShipsFactory = artifacts.require("GameOfShipsFactory");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(GameOfShipsFactory);
}
