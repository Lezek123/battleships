const round = (number, precision, roundMethod = Math.round) =>
    (roundMethod(number * Math.pow(10, precision)) / Math.pow(10, precision));

module.exports = { round };