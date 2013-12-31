
var todos = require('./todos')

  , _ = require('lodash')

module.exports = {
  mergeTodos: mergeTodos,
  todosFor: todosFor,
  todomap: todomap
}

function todomap() {
  var map = {}
  for (var type in todos) {
    for (var todo in todos[type]) {
      map[todo] = todos[type][todo]
    }
  }
  return map
}

function todosFor(person) {
  var matched = []
  for (var type in todos) {
    for (var todo in todos[type]) {
      if (todos[type][todo].check(person)) {
        matched.push(todo)
      }
    }
  }
}

// Currently, I go through and
// - retire any present that no longer match and where completed.
// - add new ones
// - merge occurring ones that haven't been checked.
//
// >> I don't yet do anything with retired ones that resurface. I think I
// probably should do something there, though.
function mergeTodos(person, now) {
  // go through and get all the 
  var current = _.cloneDeep(person.more.todos)
    , detected = todosFor(person)
    , result = []
    , mp = {}
  now = now || new Date()
  current.forEach(function (todo) {
    mp[todo.type] = todo
  })
  detected.forEach(function (type) {
    var todo = {
      type: type,
      created: now,
      completed: false,
      retired: false,
      hard: false,
    }
    if (mp[type]) {
      todo = mp[type]
      if (todo.retired) {
        // TODO: do something to let the user know that we're resurrecting
        // this.
        todo.retired = false
        todo.completed = false
      }
      delete mp[type]
    }
    result.push(todo)
  })
  // the ones that weren't picked up
  for (var type in mp) {
    if (mp[type].completed && !mp[type].retired) {
      mp[type].retired = now
    }
    if (mp[type].retired) {
      result.push(mp[type])
    }
    // if it wasn't completed/retired, we don't care... let it slide
  }
  return result
}

