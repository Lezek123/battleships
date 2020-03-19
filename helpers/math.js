const round = (number, precision) =>
    (Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision));

module.exports = { round };