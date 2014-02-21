
module.exports = Db

/**
 * Provides a high-level interface to the database for the crawler and socket.
 *
 * Not much logic here either.
 */

function Db(db, userId) {
  this.userId = userId
  this.db = db
}

Db.prototype = {
  getHistory: function (done) {
    this.db.collection('history').find({
      user: this.userId,
    }, {
      sort: 'modified'
    }).toArray(done)
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

  set: function (id, key, value, done) {
    var obj = {id: id, user: this.userId}
    obj[key] = value
    this.db.collection('people').update({
      id: id,
      user: this.userId
    }, {$set: obj}, {upsert: true}, function (err) {
      done && done(err)
    })
  },

  setLineage: function (id, lineage, done) {
    this.set(id, 'lineage', lineage, done)
  },

  setTodos: function (id, todos, done) {
    this.set(id, 'todos', todos, done)
  },

  setGet: function (id, key, value, done) {
    this.set(id, key, value, function (err) {
      if (!done) return
      if (err) return done(err)
      this.db.collection('people').findOne({
        id: id,
        user: this.userId
      }, function (err, person) {
        done(person)
      })
    }.bind(this))
  },

  // TODO: should these all return the full person data? Do they need to?
  setStarred: function (id, value, done) {
    this.setGet(id, 'starred', value, done)
  },

  setCustomTodos: function (id, todos, done) {
    this.setGet(id, 'customTodos', todos, done)
  },

  setNote: function (id, val, done) {
    this.setGet(id, 'note', todos, done)
  },

  setGetTodoAttr: function (id, type, attr, val, done) {
    var obj = {}
    obj['todos.$.' + attr] = val
    this.db.collection('people').update({
      id: id,
      user: this.userId,
      'todos.type': type
    }, {$set: obj}, function () {
      if (!done) return
      this.db.collection('people').findOne({
        id: id,
        user: this.userId
      }, function (err, person) {
        done(person)
      })
    }.bind(this))
  },

  setTodoDone: function (id, type, val, done) {
    this.setGetTodoAttr(id, type, 'completed', val, done)
  },

  setTodoHard: function (id, type, val, done) {
    this.setGetTodoAttr(id, type, 'hard', val, done)
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

