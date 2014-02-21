
var todos = require('../lib/todos')
  , utils = require('./utils')

module.exports = {
  todos: {
    map: todos,
    titles: utils.getTodoTitles(todos),
    types: utils.typeMap(todos)
  }
}

