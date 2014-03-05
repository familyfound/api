
var todos = require('./lib/todos')
  , fs = require('fs')

var text = '\n'
  , todo

for (var category in todos) {
  text += '## ' + category + '\n\n'
  for (var type in todos[category]) {
    todo = todos[category][type]
    text += '### ' + type + '\n'
    text += '**Title:** ' + todo.title + '\n'
    if (todo.help) text += '**Help:** ' + todo.help + '\n'
    if (todo.help_link) text += '**Help Link:** ' + todo.help_link + '\n'
    text += '\n'
  }
  text += '\n'
}

fs.writeFileSync('docs/todos.md', text)

