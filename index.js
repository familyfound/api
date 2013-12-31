
var express = require('express')
  , cors = require('cors')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)

  , getCrawler = require('./fslayer')
  , config = require('./config')
  , Socket = require('./socket')

app.use(cors())
app.use(express.static(__dirname + '/public'))

server.listen(config.port, function () {
  console.log('listening')
})

function newsocket(socket) {
  socket.on('authorize', function (token, ready) {
    getCrawler(token, function (err, crawler) {
      new Socket(socket, crawler)
      ready()
    })
  })
}

io.sockets.on('connection', function (socket) {
  newsocket(socket)
})

