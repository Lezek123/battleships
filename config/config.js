const in_production = process.env.NODE_ENV === 'production';
const config = require(in_production ? './prod' : './dev');
module.exports = config;