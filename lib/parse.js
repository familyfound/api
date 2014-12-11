
var fs = require('fs')
  , debug = require('debug')('ff:api')

/**
 * This should really be unittested
 */

module.exports = {
  agespan: agespan,
  sources: sources,
  relations: relations,
  duplicates: duplicates
}

function agespan(lifespan) {
  var parts = lifespan.split('-')
    , born = parseInt(parts[0], 10)
    , died = parseInt(parts[1], 10)
  if (isNaN(born) || isNaN(died)) return undefined
  return died - born
}

// what do I want?
// - display
// - parents [list of ids]
// - mother: id
// - father: id
// - families: {
//     spouseid: [childid, childid, childid],
//     ...
//   }
//
// b/c
// relationships
//   - http://gedcomx.org/Couple, person1.resourceId, person2.resourceId
//   - http://gedcomx.org/ParentChild
//     - parent: person1.resourceId
//     - child:  person2.resourceId
// childAndParentsRelationships
//   - father, mother, child
//
function relations(id, data) {
  // fs.writeFileSync('ex-rels.json', JSON.stringify(data))
  debug('relations', id, data)
  if (!data.persons) {
    debug('no relation found', data)
    return false
  }

  var ids = []
    , person = {
        display: data.persons[0].display,
        id: id,
        multipleParents: false,
        parents: [],
        children: [],
        spouses: [],
        mother: null,
        father: null,
        families: {}
      }
  if (person.display.lifespan) {
    person.display.age = agespan(person.display.lifespan)
  }
  if (data.childAndParentsRelationships) {
    data.childAndParentsRelationships.forEach(function (rel) {
      if (rel.child && rel.child.resourceId === person.id) {
        if (rel.father && rel.father.resourceId) {
          if (person.father) person.multipleParents = true;
          person.father = rel.father.resourceId;
          person.parents.push(person.father)
          ids.push(person.father)
        }
        if (rel.mother && rel.mother.resourceId) {
          if (person.mother) person.multipleParents = true;
          person.mother = rel.mother.resourceId;
          person.parents.push(person.mother)
          ids.push(person.mother)
        }
        return
      }
      var spouseId;
      if (rel.father && rel.father.resourceId !== person.id) {
        spouseId = rel.father.resourceId;
      } else if (rel.mother && rel.mother.resourceId !== person.id) {
        spouseId = rel.mother.resourceId;
      }
      ids.push(spouseId)
      if (person.spouses.indexOf(spouseId) === -1) {
        person.spouses.push(spouseId)
      }
      if (!person.families[spouseId]) person.families[spouseId] = [spouseId];
      if (rel.child) {
        person.children.push(rel.child)
        person.families[spouseId].push(rel.child.resourceId);
        ids.push(rel.child.resourceId)
      }
    });
  }
  if (data.relationships) {
    data.relationships.forEach(function (rel) {
      if (rel.type === 'http://gedcomx.org/ParentChild') {
        if (rel.person1.resourceId === person.id) {
          if (ids.indexOf(rel.person2.resourceId) === -1) {
            if (!person.families.unknown) person.families.unknown = []
            person.families.unknown.push(rel.person2.resourceId)
            person.children.push(rel.person2.resourceId)
          }
        } else if (ids.indexOf(rel.person1.resourceId) === -1) {
          person.parents.push(rel.person1.resourceId)
        }
      } else if (rel.type === 'http://gedcomx.org/Couple') {
        var spouseId
        if (rel.person1.resourceId === person.id) {
          spouseId = rel.person2.resourceId
        } else {
          spouseId = rel.person1.resourceId
        }
        if (!person.families[spouseId]) {
          person.families[spouseId] = [spouseId]
          if (person.spouses.indexOf(spouseId) === -1) {
            person.spouses.push(spouseId)
          }
        }
      }
    })
  }
  return person;
}

function sources(id, data) {
  if (!data.persons) return []
  fs.writeFileSync('ex-sources.json', JSON.stringify(data))
  return data.persons[0].sources.map(function (source) {
    return source.description
  })
}

// find duplicates that haven't been marked as "not a match"
function duplicates(id, matches, nots) {
  if (!matches.entries) return []
  fs.writeFileSync('ex-dubplicates.json', JSON.stringify(matches, null, 2))
  fs.writeFileSync('ex-matches.json', JSON.stringify(nots, null, 2))
  var ids = nots.persons ? nots.persons.map(function (person) {
    return person.id
  }) : []
  var personids = []
  // console.log(ids, nots)
  var results = matches.entries.filter(function (entry) {
    if (entry.score < 0) return false
    var ppds = entry.content.gedcomx.persons.map(function (person) {
      return person.id
    })
    personids.push(ppds)
    // if none of the ppds are in the not-ids, then return true
    var overlap = ppds.some(function (id) {
      return ids.indexOf(id) !== -1
    })
    if (!overlap) {
      // console.log('MATCH?', ppds, ids)
    }
    return !overlap
  }).map(function (dup) {
    return {
      score: dup.score,
      title: dup.title,
      id: dup.content.gedcomx.persons[0].id
    }
  })
  /*
  if (results.length) {
    console.log('not-a-match', ids)
    console.log('the matches', personids)
    console.log(results)
  }
  */
  return results
}


