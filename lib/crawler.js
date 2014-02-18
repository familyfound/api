
// More gets you 1) sources 2) duplicates 3) temple

var async = require('async')

  , Emitter = require('events').EventEmitter
  , debug = require('debug')('fs:api')
  , utils = require('./utils')
  , KillableQueue = require('./killablequeue')

  , _ = require('lodash')

module.exports = Crawler

/**
 * Get pedigree and todos
 */
function Crawler(api, db) {
  this.api = api
  this.db = db
  this.pqueue = new KillableQueue(10, this.doPedigree, this.finishedPedigree)
  this.todoqueue = new KillableQueue(1, this.doTodos, this.finishedTodos)
  this.todosfound = 0
}

Emitter(Crawler.prototype)

_.extend(Crawler.prototype, {
  getPedigree: function (id, gens) {
    this.pqueue.cancel(true)
    this.pqueue.start([id, gens])
  },
  getTodos: function (id, num) {
    this.todoqueue.cancel(true)
    this.ttoget = num
    this.todoqueue.start(id)
  },
  finishedPedigree: function (num, time) {
    this.emit('pedigree:done', num, time)
  },
  finishedTodos: function (num, time) {
    this.emit('todos:done', num, time)
  },
  stop: function () {
    this.pqueue.cancel(true)
    this.tqueue.cancel(true)
  },
  doPedigree: function (what, done) {
    var id = what[0]
      , gens = what[1]
    async.parallel({
      rels: this.api.getRels.bind(this, id),
      data: this.db.getData.bind(this, id)
    }, function (err, person) {
      if (err) {
        this.emit('error', 'failed to get person: ' + err)
        return done()
      }
      this.emit('person', person)
      if (gens > 0) {
        // TODO: here is where we would add the ability to look through
        // children too
        person.rels.parents.forEach(function (id) {
          this.pqueue.add([id, gens-1])
        }.bind(this))
      }
      done()
    })
  },
  doTodos: function (id, done) {
    if (this.ttoget <= 0) return done()
    var cancelled = false
    async.parallel({
      api: this.api.getAll.bind(this, id),
      db: this.db.getData.bind(this, id)
    }, function (err, res) {
      if (cancelled) return done()
      if (err) {
        this.emit('error', 'failed to get todos: ' + err)
        return done()
      }
      var person = res.api
      person.data = res.db
      person.data.todos = utils.mergeTodos(person)
      this.db.saveTodos(id, person.data.todos)
      this.emit('person:more', id, person)
      if (person.data.customTodos || activeTodos(person.data.todos)) {
        this.ttoget -= 1
      }
      // TODO: here is where we would add the ability to look through
      // children too
      person.rels.parents.forEach(function (id) {
        this.tqueue.add(id)
      }.bind(this))
      done()
    }.bind(this))
    return function () {
      cancelled = true
    }
  },
})

function activeTodos(todos) {
  for (var i=0; i++; i<todos.length) {
    if (!todos[i].hard && !todos[i].completed) return true
  }
  return false
}


/***

// TODO: report errors through done..
// done(numcrawled, depth)
function breadthFirst(start, stop, get, onperson, done) {
  var crawled = []
    , lastgen = [start]
    , nextgen = []
    , curgen = 0
    , cancelled = false
  function next() {
    if (cancelled) return
    if (lastgen.length === 0) {
      curgen += 1
      lastgen = nextgen
      nextgen = []
      if (stop(crawled.length, curgen)) {
        debug('halting crawl')
        return done(crawled.length, curgen)
      }
    }
    if (lastgen.length === 0) {
      debug('Ran out of people to crawl through')
      return done(crawled.length)
    }
    var pid = lastgen.shift()
    if (crawled.indexOf(pid) !== -1) {
      debug('crawling twice', pid, lastgen, nextgen)
      return next()
    }
    crawled.push(pid)
    get(pid, function (err, person) {
      if (err) {
        debug('Error while getting more', pid, err)
        return next()
      }
      nextgen = nextgen.concat(person.rels.parents)
      onperson(pid, person, crawled.length)
      if (!stop(crawled.length, curgen)) {
        next()
      } else {
        return done(crawled.length, curgen)
      }
    })
  }
  next()
  return function () {
    cancelled = true
  }
}

// get: {more, rels, data}
//
function Crawler(token, options) {
  this.cache = {
    rels: {},
    more: {},
    data: {}
  }
  this.options = options
}

Crawler.prototype = {
  starred: function (onperson, done) {
    var that = this
    this.options.get.starred(function (err, people) {
      if (err) {
        console.error('Error while retrieving starred people')
        return done()
      }
      async.parallel(people.map(function (data) {
        return function (next) {
          that.cache.data[data.id] = data
          that.getMore(data.id, function (err, person) {
            onperson(data.id, person)
            next()
          })
        }
      }), function () {
        done()
      })
    })
  },
  crawl: function (start, num, onperson, done) {
    var gotten = 0
    return breadthFirst(start, function () {
      return gotten > num
    }, this.getMore.bind(this), function (id, person, crawled) {
      onperson(id, person, !!person.data.todos.length, crawled)
      if (!person.data.todos.length || person.data.completed) return
      var has = false
      for (var i in person.data.todos) {
        if (!person.data.todos[i].hard && !person.data.todos[i].completed) {
          has = true
          break;
        }
      }
      if (has) {
        gotten += 1
      }
    }, done)
  },
  pedigree: function (start, gens, onperson, done) {
    return breadthFirst(start, function (crawled, gen) {
      return gen > gens
    }, this.getPerson.bind(this), onperson, done)
  },
  get: function (what, id, done) {
    if (this.cache[what][id]) {
      return done(null, this.cache[what][id])
    }
    var that = this
    this.options.get[what](id, function (err, data) {
      if (err) return done(err)
      that.cache[what][id] = data
      done(null, data)
    })
  },
  getMore: function (id, done) {
    var that = this
    async.parallel({
      rels: this.get.bind(this, 'rels', id),
      more: this.get.bind(this, 'more', id),
      data: this.get.bind(this, 'data', id),
    }, function (err, person) {
      if (err) return done(err)
      if (!person.data) person.data = {}
      person.data.todos = utils.mergeTodos(person)
      that.options.saveTodos(id, person.data.todos)
      done(null, person)
    })
  },
  getPerson: function (id, done) {
    async.parallel({
      rels: this.get.bind(this, 'rels', id),
      data: this.get.bind(this, 'data', id),
    }, done)
  },
  history: function (done) {
    this.options.get.history(this.token, done)
  },
  recent_people: function (done) {
    this.options.get.recent_people(this.token, done)
  },
}
**/

