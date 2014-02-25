
// More gets you 1) sources 2) duplicates 3) temple

var async = require('async')
  , util = require('util')

  , Emitter = require('events').EventEmitter
  , debug = require('debug')('fs:api')
  , utils = require('./utils')
  , KillableQueue = require('./killablequeue')

  , _ = require('lodash')

module.exports = Crawler

function lineageData(id, display) {
  return {
    id: id,
    name: display.name,
    lifespan: display.lifespan,
    gender: display.gender,
    place: display.birthPlace || display.deathPlace
  }
}

/**
 * Get pedigree and todos
 */
function Crawler(api, db) {
  this.api = api
  this.db = db
  this.pqueue = new KillableQueue(10, this.doPedigree.bind(this), this.finishedPedigree.bind(this))
  this.tqueue = new KillableQueue(2, this.doTodos.bind(this), this.finishedTodos.bind(this))
}

util.inherits(Crawler, Emitter)

_.extend(Crawler.prototype, {
  getPedigree: function (id, gens, amBase) {
    this.pqueue.cancel(true)
    this.pqueue.start([id, gens].concat(amBase ? [[]] : []))
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
  doPedigree: function (what, num, done) {
    var id = what[0]
      , gens = what[1]
      , lineage = what[2]
    async.parallel({
      rels: this.api.getRels.bind(this.api, id),
      data: this.db.getData.bind(this.db, id)
    }, function (err, person) {
      if (err) {
        this.emit('error', 'failed to get person: ' + err)
        return done()
      }
      // calculate lineage
      if (!person.data) {
        person.data = {}
      }
      if (!lineage) {
        lineage = person.data.lineage
      } else {
        person.data.lineage = lineage
      }
      var childids = (lineage || []).map(function (person) {return person.id})
      childids.push(id)
      this.emit('person', id, person, num)
      if (gens > 0 && num < 100) {
        // TODO: here is where we would add the ability to look through
        // children too
        if (childids.indexOf(person.rels.father) === -1) {
          this.pqueue.add([person.rels.father, gens-1, lineage && lineage.concat([lineageData(what[0], person.rels.display)])])
        }
        if (childids.indexOf(person.rels.mother) === -1) {
          this.pqueue.add([person.rels.mother, gens-1, lineage && lineage.concat([lineageData(what[0], person.rels.display)])])
        }
        /*
        person.rels.parents.forEach(function (id) {
          if (childids.indexOf(id) !== -1) {
            // I'm my own grandpa
            return
          }
          this.pqueue.add([id, gens-1, lineage && lineage.concat([lineageData(what[0], person.rels.display)])])
        }.bind(this))
        */
      }
      var display = {
        name: person.rels.display.name,
        lifespan: person.rels.display.lifespan,
        gender: person.rels.display.gender,
        generation: lineage && lineage.length
      }
      this.db.setDisplayLineage(id, display, lineage, done)
    }.bind(this))
  },
  doTodos: function (id, num, done) {
    if (this.ttoget <= 0) return done()
    var cancelled = false
    this.emit('person:loading', id)
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
      this.emit('person:more', id, person, num)
      if (person.data.customTodos || utils.activeTodos(person.data.todos)) {
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


