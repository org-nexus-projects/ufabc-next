const _ = require('lodash')
const crypto = require('crypto')

module.exports = function(disciplina, keys, silent = true) {
  keys = keys || ['disciplina', 'turno', 'campus', 'turma'] 

  let d = _(disciplina || {})
    .pick(keys)
    .mapValues(String)
    .mapValues(_.camelCase)
    .toPairs()
    .sortBy(0)
    .fromPairs()
    .values()
    .value()
    .join('')

  if(!silent) {
    console.log(d)
  }

  return crypto.createHash('md5').update(d).digest('hex')
}