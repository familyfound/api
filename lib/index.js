
var getCrawler = require('./fslayer')
  , Socket = require('./socket')

function newsocket(mongo, socket) {
  socket.on('authorize', function (userId, token, ready) {
    console.log('on auth')
    getCrawler(userId, mongo, token, function (err, crawler, db) {
      if (err) {
        console.error('Failed to initialize crawler', err)
        return
      }
      new Socket(socket, crawler, userId, db)
      ready()
    })
  })
}

module.exports = function (mongo, io, app) {
  io.sockets.on('connection', function (socket) {
    newsocket(mongo, socket)
  })
}

