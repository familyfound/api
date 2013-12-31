
var getCrawler = require('./fslayer')
  , config = require('./config')
  , Socket = require('./socket')

function newsocket(socket) {
  socket.on('authorize', function (token, ready) {
    getCrawler(token, function (err, crawler) {
      new Socket(socket, crawler)
      ready()
    })
  })
}

module.exports = function (io, app) {
  io.sockets.on('connection', function (socket) {
    newsocket(socket)
  })
}

