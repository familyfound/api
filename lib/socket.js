
var debug = require('debug')('fs:api:socket')

module.exports = Socket

/**
 * Wiring up the crawler with the socket io business
 */
function Socket(socket, userId, db, crawler) {
  this.socket = socket
  this.userId = userId
  this.db = db
  this.crawler = crawler

  var e
  for (e in this.crawl_events) {
    this.crawler.on(e, this.crawl_events[e].bind(this))
  }
  for (e in this.events) {
    this.socket.on(e, this.events[e].bind(this))
  }
}

Socket.prototype = {
  events: {
    'get:pedigree': function (id, gens) {
      debug('Get Pedigree', id, gens)
      this.crawler.getPedigree(id, gens, this.userId === id)
    },
    'get:todos': function (id, num) {
      debug('Get todos', id, num)
      this.crawler.getTodos(id, num)
    },
    'get:history': function (done) {
      debus('Get history')
      this.db.getHistory(function (err, history) {
        if (err) return this.socket.emit('error', 'get:history', err)
        this.socket.emit('history', history)
      }.bind(this))
    },
    'get:starred': function (done) {
      debug('Get starred')
      this.db.getStarred(function (err, history) {
        if (err) return this.socket.emit('error', 'get:starred', err)
        this.socket.emit('starred', history)
      }.bind(this))
    },
    'set:starred': function (id, value, done) {
      debug('set starred', id, value)
      this.db.setStarred(id, value, done)
    },
    'set:custom-todos': function (id, todos, done) {
      this.db.setCustomTodos(id, todos, done)
    },
    'set:note': function (id, value, done) {
      debug('set note', id, value)
      this.db.setNote(id, value, done)
    },
    'set:todo:done': function (id, type, key, val, done) {
      debug('set todo done', id, type, key, val)
      this.db.setTodoDone(id, type, key, val, done)
    },
    'set:todo:hard': function (id, type, key, val, done) {
      debug('set todo hard', id, type, key, val)
      this.db.setTodoHard(id, type, key, val, done)
    },
    'disconnect': function () {
      this.crawler.stop()
    }
  },
  crawl_events: {
    'person': function (id, person, numcrawled) {
      this.socket.emit('person', id, person, numcrawled)
    },
    'person:more': function (id, data, numcrawled) {
      this.socket.emit('person:more', id, data, numcrawled)
    },
    'person:loading': function (id) {
      this.socket.emit('person:loading', id)
    },
    'pedigree:done': function (total, time) {
      this.socket.emit('pedigree:done', total, time)
    },
    'todos:done': function (total, time) {
      this.socket.emit('todos:done', total, time)
    },
    'error': function (err) {
      this.socket.emit('crawler:error', err)
    }
  },
}










/**

// get.data(id, done(err, data))
// get.rels(id, done(err, rels))
// get.more(id, done(err, more))
// get.history(id, done(err, items))
function Socket(socket, crawler, userId, db) {
  this.sock = socket
  this.crawler = crawler
  this.userId = userId
  this.db = db
  this.listen()
  this.cancellor = null
}

Socket.prototype = {
  listen: function () {
    // the main entry point. Asks for the fan and for people to work on
    this.sock.on('getsome', this.getsome.bind(this))

    this.sock.on('starred', this.starred.bind(this))
    this.sock.on('crawl', this.crawl.bind(this))
    this.sock.on('pedigree', this.pedigree.bind(this))
    this.sock.on('tree', this.pedigree.bind(this))
    this.sock.on('set:completed', this.setCompleted.bind(this))
    this.sock.on('set:starred', this.setStarred.bind(this))
    this.sock.on('set:todo:done', this.setTodoDone.bind(this))
    this.sock.on('set:todo:hard', this.setTodoHard.bind(this))
    this.sock.on('disconnect', function () {
      if (this.cancellor) {
        this.cancellor()
        console.warn('Cancelled crawl due to disconnect')
      }
      console.log('socket disconnected')
    }.bind(this))
    // this.sock.on('more', this.crawler.more.bind(this.crawler))
    // this.sock.on('history', this.crawler.history.bind(this.crawler))
    // this.sock.on('recent_people', this.crawler.recent_people.bind(this.crawler))
  },
  starred: function (done) {
    var that = this
    this.crawler.starred(function (person) {
      that.sock.emit('starred', person)
    }, done)
  },
  pedigree: function (id, gens, done) {
    var that = this
    return this.crawler.pedigree(id, gens, function (id, person) {
      that.sock.emit('person', id, person)
    }, done)
  },
  crawl: function (id, numpeople, done) {
    var that = this
    return this.crawler.crawl(id, numpeople, function (id, person, hastodos, numcrawled) {
      that.sock.emit('more_person', id, person, hastodos, numcrawled)
    }, done)
  },
  setStarred: function (id, when, done) {
  },
  setCompleted: function (id, when, done) {
  },
  setTodoDone: function (id, type, val, done) {
  },
  setTodoHard: function (id, type, val, done) {
  },
  getsome: function (id, gens, numpeople, done) {
    if (this.cancellor) this.cancellor()
    var tree = null
      , craw = null
      , finished = 0
    this.cancellor = function () {
      tree()
      craw()
    }
    function doneone() {
      finished += 1
      if (finished == 2) return done()
    }
    tree = this.pedigree(id, gens, doneone)
    craw = this.crawl(id, numpeople, doneone)
  }
}

**/


