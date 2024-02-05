import _ from 'lodash'

module.exports = (payload, max) => {
  let json = JSON.parse(_.get(new RegExp(/^\w*=(.*)\;/).exec(payload), '[1]', {}))

  if(max) return json.slice(0, max)
  return json
}