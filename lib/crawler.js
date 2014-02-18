
// More gets you 1) sources 2) duplicates 3) temple

var async = require('async')
  , util = require('util')

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
  this.pqueue = new KillableQueue(10, this.doPedigree.bind(this), this.finishedPedigree.bind(this))
  this.tqueue = new KillableQueue(1, this.doTodos.bind(this), this.finishedTodos.bind(this))
}

util.inherits(Crawler, Emitter)

_.extend(Crawler.prototype, {
  getPedigree: function (id, gens) {
    this.pqueue.cancel(true)
    this.pqueue.start([id, gens])
  },
  getTodos: function (id, num) {
    this.tqueue.cancel(true)
    this.ttoget = num
    this.tqueue.start(id)
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
      rels: this.api.getRels.bind(this.api, id),
      data: this.db.getData.bind(this.db, id)
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
    }.bind(this))
  },
  doTodos: function (id, done) {
    if (this.ttoget <= 0) return done()
    var cancelled = false
    async.parallel({
      api: this.api.getAll.bind(this.api, id),
      db: this.db.getData.bind(this.db, id)
    }, function (err, res) {
      if (cancelled) return done()
      if (err) {
        this.emit('error', 'failed to get todos: ' + err)
        return done()
      }
      var person = {
        rels: res.api.rels,
        more: {
          sources: res.api.sources,
          duplicates: res.api.duplicates
        }
      }
      person.data = res.db || {}
      person.data.todos = utils.mergeTodos(person)
      this.db.setTodos(id, person.data.todos)
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
  for (var i=0; i<todos.length; i++) {
    if (!todos[i].hard && !todos[i].completed) return true
  }
  return false
}

