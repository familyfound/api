
try {
var data = require('./ex-rels.json')
  , parse = require('../lib/parse')
  , utils = require('../lib/utils')

var rels = parse.relations(data.persons[0].id, data)
  , person = {
      rels: rels,
      more: {},
      data: {}
    }

  console.log(JSON.stringify(rels, null, 2))
  console.log(JSON.stringify(utils.todosFor(person), null, 2))
} catch (e){}
