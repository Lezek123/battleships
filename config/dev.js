const Web3 = require('web3');

module.exports = {
    sessionSecret: 'somesecretkey',
    mongoURI: 'mongodb://127.0.0.1:27017/ships',
    web3Provider: new Web3.providers.WebsocketProvider("ws://localhost:8545"),
}