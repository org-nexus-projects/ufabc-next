var express = require('express')
var app = express()
var path = require('path')
var compression = require('compression')
var cors = require('cors')

app.use(cors())
app.use(compression())
app.use('/static', express.static(path.join(__dirname, '../dist/chrome')))

const PORT = process.env.PORT || process.env.NODE_PORT || 3000

app.listen(PORT, function () {
  console.log('Example app listening on port:' + PORT)
})