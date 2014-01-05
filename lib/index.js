
var getCrawler = require('./fslayer')
  , Socket = require('./socket')

function newsocket(mongo, socket) {
  socket.on('authorize', function (token, ready) {
    getCrawler(mongo, token, function (err, crawler) {
      new Socket(socket, crawler)
      ready()
    })
  })
}

module.exports = function (mongo, io, app) {
  io.sockets.on('connection', function (socket) {
    newsocket(mongo, socket)
  })
}

