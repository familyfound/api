
try {
var fs = require('fs')
  , data = require('./ex-rels.json')
  , parse = require('../lib/parse')

console.log(JSON.stringify(parse.relations(data.persons[0].id, data), null, 2))
} catch (e) {
}
