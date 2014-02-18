
var async = require('async')
  , parse = require('./parse')

module.exports = CrawlApi

/**
 * This provides a higher-level interface to fsapi for the crawler. 
 *
 * Doesn't need unittesting really - no logic happening.
 */

function CrawlApi(userId, token, cached) {
  this.userId = userId
  this.token = token
  this.cached = cached
}

CrawlApi.prototype = {
  getAll: function (id, done) {
    async.parallel({
      rels; this.getRels.bind(this, id),
      sources: this.getSources.bind(this, id),
      duplicates: this.getDuplicates.bind(this, id)
    }, done)
  },

  getMore: function (id, done) {
    async.parallel({
      sources: this.getSources.bind(this, id),
      duplicates: this.getDuplicates.bind(this, id)
    }, done)
  },

  getSources: function (id, done) {
    this.cached({
      path: 'person-source-references-template',
      data: {
        pid: id
      },
      token: this.token,
      newtime: 60 * 60 * 2 // 2 hours
    }, function (err, data) {
      if (err) return done(err)
      done(null, parse.sources(id, data))
    })
  },

  getMatches: function (id, done) {
    this.cached({
      path: 'person-matches-template',
      data: {
        pid: id
      },
      token: this.token,
      newtime: 60 * 60 * 2
    }, done)
  },

  getNotMatches: function (id, done) {
    this.cached({
      path: 'person-not-a-match-template',
      data: {
        pid: id
      },
      token: this.token,
      newtime: 60 * 60 * 2
    }, done)
  },

  getDuplicates: function (id, done) {
    async.parallel({
      matches: this.getMatches.bind(this, id),
      nots: this.getNotMatches.bind(this, id)
    }, function (err, data) {
      if (err) return done(err)
      done(null, parse.duplicates(id, data.matches, data.nots))
    })
  },

  getRels: function (id, done) {
    this.cached({
      path: 'person-with-relationships-query',
      data: {
        person: id
      },
      token: this.token
    }, function (err, data) {
      if (err) return done(err)
      done(null, parse.relations(id, data))
    })
  },
}
