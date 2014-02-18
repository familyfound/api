
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

  setTodos: function (id, todos, done) {
    this.db.collection('people').update({
      id: id,
      user: this.userId
    }, {
      $set: {todos: todos, id: id, user: this.userId}
    }, {upsert: true}, function () {
      done && done()
    })
  },

  // TODO: should these all return the full person data? Do they need to?
  setStarred: function (id, value, done) {
    this.db.collection('people').update({
      id: id,
      user: this.userId
    }, {
      $set: {starred: value}
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

  setCustomTodos: function (id, todos, done) {
    this.db.collection('people').update({
      id: id,
      user: this.userId
    }, {
      $set: {customTodos: todos}
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

  setNote: function (id, val, done) {
    this.db.collection('people').update({
      id: id,
      user: this.userId
    }, {
      $set: {note: val}
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

  setTodoDone: function (id, type, val, done) {
    this.db.collection('people').update({
      id: id,
      user: this.userId,
      'todos.type': type
    }, {
      $set: {
        'todos.$.completed': val
      }
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

  setTodoHard: function (id, type, val, done) {
    this.db.collection('people').update({
      id: id,
      user: this.userId,
      'todos.type': type
    }, {
      $set: {
        'todos.$.hard': val
      }
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

