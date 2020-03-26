const Web3 = require('web3');

module.exports = {
    sessionSecret: process.env.SESSION_SECRET,
    mongoURI: process.env.MONGODB_URI,
    web3Provider: new Web3.providers.WebsocketProvider("wss://ropsten.infura.io/ws/v3/50111644f2784c749cad5cc35c4f366e"),
}