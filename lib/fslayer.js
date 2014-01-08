
var Crawler = require('./crawler')
  , parse = require('./parse')

  , async = require('async')
  , mdb = require('mongodb')
  , MongoClient = mdb.MongoClient
  , fs = require('familysearch')

// getcrawler
module.exports = function (mongo, token, done) {
  var FS = fs.single()
  FS.ondone = [function () {
    MongoClient.connect(mongo, function (err, db) {
      if (err) return done(err)
      var cached = FS.cached.bind(FS, db.collection('fs-cached'))
        , crawler = makeCrawler(token, cached, db)
      done(null, crawler)
    })
  }]
}

function makeCrawler(token, cached, db) {
  return new Crawler(token, {
    get: {
      rels: function (id, done) {
        cached('person-with-relationships-query', {
          person: id
        }, token, function (err, data) {
          if (err) return done(err)
          done(null, parse.relations(id, data))
        })
      },
      more: function (id, done) {
        async.parallel({
          sources: function (next) {
            cached('person-source-references-template', {
              pid: id
            }, token, function (err, data) {
              if (err) return done(err)
              next(null, parse.sources(id, data))
            })
          },
          duplicates: function (next) {
            cached('person-matches-template', {
              pid: id
            }, token, function (err, data) {
              next(null, parse.duplicates(id, data))
            })
          }
        }, done)
      },
      data: function (id, done) {
        db.collection('people').findOne({
          id: id
        }, done)
      },
      history: function (done) {
        db.collection('history').find({
          user: token,
        }, {
          sort: 'modified'
        }).toArray(done)
      },
      starred: function (done) {
        db.collection('people').find({
          user: token,
          starred: true
        }, {
          sort: 'modified'
        }).toArray(done)
      },
      recent_people: function (id, done) {
        done(new Error('recent people not implemented'))
      }
    },
    saveTodos: function (id, todos, done) {
      db.collection('people').update({
        id: id
      }, {
        $set: {todos: todos, id: id}
      }, {upsert: true}, function () {
        done && done()
      })
    }
  })
}

