const fs = require('fs')
const vueConfig = require('../vue.config')

vueConfig.publicPath = '/app/'

fs.writeFileSync('vue.config.js', `module.exports = ${JSON.stringify(vueConfig, null, 2)}`)