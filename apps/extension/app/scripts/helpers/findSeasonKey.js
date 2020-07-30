const findSeason = require('./findSeason')

module.exports = function findSeasonKey(date) {
  const d = findSeason(date)
  return d.year + ':' + d.quad
}