
var todos = require('./todos')

  , debug = require('debug')('ff:api:util')
  , _ = require('lodash')

module.exports = {
  mergeTodos: mergeTodos,
  todosFor: todosFor,
  todomap: todomap,
  activeTodos: activeTodos
}

var MAP = module.exports.map = todomap()

function activeTodos(todos) {
  for (var i=0; i<todos.length; i++) {
    if (MAP[todos[i].type].multi) {
      for (var name in todos[i]) {
        if (!todos[i][name].hard && !todos[i][name].completed) return true
      }
    } else {
      if (!todos[i].hard && !todos[i].completed) return true
    }
  }
  return false
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
  var matched = {}
    , result
  for (var type in todos) {
    for (var todo in todos[type]) {
      result = todos[type][todo].check(person)
      if (result !== false) {
        matched[todo] = result
      }
    }
  }
  return matched
}

function nTodo(type, data, created) {
  return {
    type: type,
    data: data,
    created: created,
    completed: false,
    retired: false,
    hard: false,
  }
}

function multiTodos(type, data, now, olds) {
  var todo
    , todos = []
  for (var key in data) {
    todo = nTodo(type, data[key], now)
    todo.key = key
    if (olds[type] && olds[type][key]) {
      todo = olds[type][key]
      todo.data = data[key]
      if (todo.retired) {
        // TODO: do something to let the user know that we're resurrecting
        // this.
        todo.retired = false
        todo.completed = false
      }
      delete olds[type][key]
    }
    todos.push(todo)
  }
  if (olds[type]) {
    for (key in olds[type]) {
      if (olds[type][key].completed && !olds[type][key].retired) {
        olds[type][key].retired = now
      }
      if (olds[type][key].retired) {
        todos.push(olds[type][key])
      }
    }
  }
  delete olds[type]
  return todos
}

function freshTodos(type, data, now, olds) {
  debug('fresh todos', type, data, now)
  if (MAP[type].multi) return multiTodos(type, data, now, olds)
  var todo = nTodo(type, data, now)
  if (!olds[type]) return [todo]
  todo = olds[type]
  todo.data = data
  if (todo.retired) {
    // TODO: do something to let the user know that we're resurrecting
    // this.
    todo.retired = false
    todo.completed = false
  }
  delete olds[type]
  debug('fresh done', todo)
  return [todo]
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
  var current = _.cloneDeep(person.data.todos) || []
    , detected = todosFor(person)
    , result = []
    , mp = {}
  now = now || new Date()
  current.forEach(function (todo) {
    debug('looking at current todo', todo)
    if (MAP[todo.type].multi) {
      if (!mp[todo.type]) mp[todo.type] = {}
      mp[todo.type][todo.key] = todo
    } else {
      mp[todo.type] = todo
    }
  })
  Object.keys(detected).forEach(function (type) {
    result = result.concat(freshTodos(type, detected[type], now, mp))
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

