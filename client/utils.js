
module.exports = {
  getTodoTitles: getTodoTitles,
  typeMap: typeMap
}

function typeMap(todos) {
  var titles = {}
  for (var section in todos) {
    for (var key in todos[section]) {
      titles[key] = todos[section][key]
    }
  }
  return titles
}

function getTodoTitles(todos) {
  var titles = {}
  for (var section in todos) {
    for (var key in todos[section]) {
      titles[key] = todos[section][key].title
    }
  }
  return titles
}

