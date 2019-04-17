const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const fallback = require('express-history-api-fallback')

let server = express()

server.use(compression())
  
server.use(bodyParser.urlencoded({extended: false}))
server.use(bodyParser.json())

let vueStatic = express.static('../dist')
server.use('/app', vueStatic)
server.use('/app', fallback('index.html', { root: '../dist' }))

let static = express.static('./static')
server.use(static)
server.use(fallback('index.html', { root: './static' }))

server.listen(process.env.PORT || 7000)