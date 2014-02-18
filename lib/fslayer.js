
var mdb = require('mongodb')
  , MongoClient = mdb.MongoClient
  , debug = require('debug')('fs:api')
  , fs = require('familysearch')

/**
 * This just wires up the db and FS
 */
module.exports = function (mongo, done) {
  var FS = fs.single()
  debug('Setting up fs')
  FS.onDone(function () {
    debug('connecting', mongo)
    MongoClient.connect(mongo, function (err, db) {
      debug('connected')
      if (err) return done(err)
      var cached = FS.bouncy_cached.bind(FS, db.collection('fs-cached'))
      done(null, cached, db)
    })
  })
}

