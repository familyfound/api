
var fs = require('fs')

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

function duplicates(id, data) {
  if (!data.entries) return []
  fs.writeFileSync('ex-dubplicates.json', JSON.stringify(data))
  return data.entries.map(function (dup) {
    return {
      score: dup.score,
      title: dup.title
    }
  })
}


