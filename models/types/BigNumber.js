const
    web3 = require('web3'),
    { BN } = web3.utils;

const bnStringValidator = (bnString) => bnString.match(/^[0-9]+$/);

module.exports = {
    type: String,
    validate: { validator: bnStringValidator, message: 'Invalid BigNumber string!' },
    set: (bn) => bn && bn.toString(10),
    get: (string) => string && new BN(string, 10)
}