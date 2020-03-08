const GameOfShips = artifacts.require("GameOfShips");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(GameOfShips);
}
