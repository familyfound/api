
var async = require('async')

module.exports = Db

/**
 * Provides a high-level interface to the database for the crawler and socket.
 *
 * Not much logic here either.
 */

function Db(db, userId, socket) {
  this.userId = userId
  this.db = db
  this.socket = socket
}

Db.prototype = {
  getHistory: function (done) {
    this.db.collection('history').find({
      user: this.userId,
    }).sort({date: -1}).limit(20).toArray(done)
  },

  getStarred: function (done) {
    this.db.collection('people').find({
      user: this.userId,
      starred: {$exists: true, $ne: false}
    }, {
      sort: 'starred'
    }).toArray(done)
  },

  getData: function (id, done) {
    this.db.collection('people').findOne({
      id: id,
      user: this.userId
    }, done)
  },

  set: function (id, key, value, done, nomod) {
    var obj = {id: id, user: this.userId}
      , now = new Date()
    obj[key] = value
    if (!nomod) obj.modified = now
    this.db.collection('people').update({
      id: id,
      user: this.userId,
    }, {$set: obj}, {upsert: true}, function (err) {
      done && done(err)
    })
  },

  sets: function (id, obj, done, nomod) {
    var now = new Date()
    obj.id = id
    obj.user = this.userId
    if (!nomod) obj.modified = now
    this.db.collection('people').update({
      id: id,
      user: this.userId,
    }, {$set: obj}, {upsert: true}, function (err) {
      done && done(err)
    })
  },

  setDisplayLineage: function (id, display, lineage, done) {
    this.sets(id, {
      lineage: lineage,
      display: display
    }, done, true)
  },

  setLineage: function (id, lineage, done) {
    this.set(id, 'lineage', lineage, done, true)
  },

  setTodos: function (id, todos, done) {
    this.set(id, 'todos', todos, done, true)
  },

  setGet: function (id, key, value, done) {
    this.set(id, key, value, function (err) {
      if (!done) return
      if (err) return done(err)
      this.getData(id, function (err, data) {
        // if (err)
        this.addHistoryItem(id, data.display, key, value, function (err) {
          done(data)
        })
      }.bind(this))
      /*
      async.parallel({
        person: this.getData.bind(this, id),
        more: this.addHistoryItem.bind(this, id, key, value)
      }, function (err, res) {
        done(res.person)
      })
      */
    }.bind(this))
  },

  /**
   * History item looks like
   * {
   *   id: personId,
   *   user: the user that added it,
   *   key: the attr that changed,
   *   value: the thing that added,
   *   date: data,
   *   display: {
   *     name: str,
   *     lifespan: str,
   *     gender: str,
   *     generation: length of the lineage,
   *   }
   * }
   */
  addHistoryItem: function (id, display, key, value, done) {
    this.rawAddHistory({
      id: id,
      key: key,
      date: new Date(),
      display: display,
      user: this.userId,
      value: value
    }, done)
  },

  addTodoHistoryItem: function (id, display, type, attr, val, done) {
    this.rawAddHistory({
      id: id,
      key: attr,
      todo: type,
      date: new Date(),
      display: display,
      user: this.userId,
      value: val
    }, done)
  },

  rawAddHistory: function (item, done) {
    this.socket.emit('history:item', item)
    this.db.collection('history').insert(item, done)
  },

  // TODO: should these all return the full person data? Do they need to?
  setStarred: function (id, value, done) {
    this.setGet(id, 'starred', value, done)
  },

  setCustomTodos: function (id, todos, done) {
    this.setGet(id, 'customTodos', todos, done)
  },

  setNote: function (id, val, done) {
    this.setGet(id, 'note', val, done)
  },

  setTodoAttr: function (id, type, key, attr, val, done) {
    var obj = {}
      , search = {
          id: id,
          user: this.userId,
          'todos.type': type
        }
    if (key) {
      search['todos.key'] = key
    }
    obj['todos.$.' + attr] = val
    obj.modified = new Date()
    this.db.collection('people').update(search, {$set: obj}, function (err) {
      if (!done) return
      done && done(err)
    }.bind(this))
  },

  setGetTodoAttr: function (id, type, key, attr, val, done) {
    this.setTodoAttr(id, type, key, attr, val, function (err) {
      if (!done) return
      if (err) return done(err)
      this.getData(id, function (err, data) {
        // if (err)
        this.addTodoHistoryItem(id, data.display, type, attr, val, function (err) {
          done(data)
        })
      }.bind(this))
      /**
      async.parallel({
        person: this.getData.bind(this, id),
        more: this.addTodoHistoryItem.bind(this, id, type, attr, val)
      }, function (err, res) {
        done(res.person)
      })
      **/
    }.bind(this))
  },

  setTodoNote: function (id, type, key, val, done) {
    this.setGetTodoAttr(id, type, key, 'note', val, done)
  },

  setTodoDone: function (id, type, key, val, done) {
    this.setGetTodoAttr(id, type, key, 'completed', val, done)
  },

  setTodoHard: function (id, type, key, val, done) {
    this.setGetTodoAttr(id, type, key, 'hard', val, done)
  },

  /** DIsabled for the moment, might not need at all
  setCompleted: function () {
    this.db.collection('people').update({
      id: id,
      user: this.userId
    }, {
      $set: {completed: when}
    }, function () {
      if (!done) return
      this.db.collection('people').findOne({
        id: id,
        user: this.userId
      }, function (err, person) {
        done(person)
      })
    }.bind(this))
  },
  **/

}

