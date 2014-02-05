
var Crawler = require('./crawler')
  , parse = require('./parse')

  , async = require('async')
  , mdb = require('mongodb')
  , MongoClient = mdb.MongoClient
  , debug = require('debug')('fs:api')
  , fs = require('familysearch')

// getcrawler
module.exports = function (userId, mongo, token, done) {
  var FS = fs.single()
  debug('Setting up fs')
  FS.onDone(function () {
    debug('connecting', mongo)
    MongoClient.connect(mongo, function (err, db) {
      debug('connected')
      if (err) return done(err)
      var cached = FS.cached.bind(FS, db.collection('fs-cached'))
        , crawler = makeCrawler(userId, token, cached, db)
      done(null, crawler, db)
    })
  })
}

function getSources(id, token, cached, done, next) {
  cached({
    path: 'person-source-references-template',
    data: {
      pid: id
    },
    token: token,
    newtime: 60 * 60 * 2 // 2 hours
  }, function (err, data) {
    if (err) return done(err)
    next(null, parse.sources(id, data))
  })
}

function getDuplicates(id, token, cached, done, next) {
  async.parallel({
    matches: function (cb) {
      cached({
        path: 'person-matches-template',
        data: {
          pid: id
        },
        token: token,
        newtime: 60 * 60 * 2
      }, cb)
    },
    nots: function (cb) {
      cached({
        path: 'person-not-a-match-template',
        data: {
          pid: id
        },
        token: token,
        newtime: 60 * 60 * 2
      }, cb)
    }
  }, function (err, data) {
    if (err) return done(err)
    next(null, parse.duplicates(id, data.matches, data.nots))
  })
}

function getRels(token, cached, id, done) {
  cached({
    path: 'person-with-relationships-query',
    data: {
      person: id
    },
    token: token
  }, function (err, data) {
    if (err) return done(err)
    done(null, parse.relations(id, data))
  })
}

function makeCrawler(userId, token, cached, db) {
  return new Crawler(token, {
    get: {
      rels: getRels.bind(null, token, cached),
      more: function (id, done) {
        var tasks = {
          sources: getSources.bind(null, id, token, cached, done),
          duplicates: getDuplicates.bind(null, id, token, cached, done)
        }
        async.parallel(tasks, done)
      },
      data: function (id, done) {
        db.collection('people').findOne({
          id: id,
          user: userId
        }, done)
      },
      history: function (done) {
        db.collection('history').find({
          user: userId,
        }, {
          sort: 'modified'
        }).toArray(done)
      },
      starred: function (done) {
        db.collection('people').find({
          user: userId,
          starred: {$exists: true, $ne: false}
        }, {
          sort: 'starred'
        }).toArray(done)
      },
      recent_people: function (id, done) {
        done(new Error('recent people not implemented'))
      }
    },
    saveTodos: function (id, todos, done) {
      db.collection('people').update({
        id: id,
        user: userId
      }, {
        $set: {todos: todos, id: id, user: userId}
      }, {upsert: true}, function () {
        done && done()
      })
    }
  })
}

