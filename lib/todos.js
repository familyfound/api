
var MIN_SOURCES = 3
  , MIN_PARENTING_AGE = 15
  , MIN_CHILDREN = 3
  , THIS_YEAR = new Date().getFullYear()
  , MIN_FIND_CHILDREN = 130 // must be born more than x years ago to get a "Find children"
  , MAX_CHILDREN = {
      'Male': 30,
      'Female': 15
    }
  , MAX_MARRIAGES = {
      'Male': 10,
      'Female': 5
    }

/**
 * All of the todos
 */

function ageRange(range) {
  var parts = range.split('-')
  return parts.map(function (p) {
    return parseInt(p, 10) || false
  })
}

module.exports = {
  information: {
    'resolve duplicates': {
      title: 'Possible duplicate: {}',
      cleanup: true,
      multi: true,
      check: function (person) {
        if (!person.more.duplicates || !person.more.duplicates.length) return false
        var res = {}
        person.more.duplicates.map(function (dup) {
          var title = dup.title.replace(/^Person /, '').replace('(', '"').replace(')', '"')
          res[dup.id] = {
            links: {
              'Click to resolve': 'https://familysearch.org/tree/#view=merge&person=' + person.rels.id + '&otherPerson=' + dup.id,
            },
            args: title
          }
        })
        return res
      }
    },
    'find name': {
      title: 'Find name',
      check: function (person) {
        return !person.rels.display.name
      }
    },
    'find birth info': {
      title: 'Find birth {}',
      check: function (person) {
        var tofind = []
        if (!person.rels.display.birthDate) {
          tofind.push('date')
        }
        if (!person.rels.display.birthPlace) {
          tofind.push('place')
        }
        if (!tofind.length) return false
        return tofind.join(' and ')
      }
    },
    'find death info': {
      title: 'Find death {}',
      check: function (person) {
        if (person.rels.display.lifespan.match(/Living/)) return false
        var tofind = []
        if (!person.rels.display.deathDate) {
          tofind.push('date')
        }
        if (!person.rels.display.deathPlace) {
          tofind.push('place')
        }
        if (!tofind.length) return false
        return tofind.join(' and ')
      }
    },
    'death before birth': {
      title: 'Death date {} years before birth date',
      cleanup: true,
      check: function (person) {
        var range = ageRange(person.rels.display.lifespan)
        if (range[0] === false || range[1] === false) return false
        if (range[0] <= range[1]) return false
        return range[0] - range[1]
      }
    }
  },
  sources: {
    'find sources': {
      title: 'Look for sources (only {} attached)',
      check: function (person) {
        // TODO: should "minimum number of sources" be configurable?
        if (person.rels.display.lifespan.match(/Living/)) return false
        var sources = person.more.sources ? person.more.sources.length : 0
        if (sources >= MIN_SOURCES) return false
        return sources
      },
    },
  },
  relationships: {
    'child to more than one spouse': {
      title: 'The child {} is associated with more than one spouse',
      cleanup: true,
      check: function (person) {
        var seen = []
          , it = false
          , mult = Object.keys(person.rels.families).some(function (spouse) {
          return person.rels.families[spouse].slice(spouse === 'unknown' ? 0 : 1).some(function (child) {
            if (seen.indexOf(child) !== -1) {
              it = child
              return true
            }
            seen.push(child)
            return false
          })
        })
        return it
      },
    },
    'parent of self': {
      title: "I'm my own grandpa",
      cleanup: true,
      check: function (person) {
        return person.rels.parents.indexOf(person.rels.id) !== -1
      },
    },
    'fix multiple parents': {
      title: 'Fix multiple parents',
      cleanup: true,
      check: function (person) {
        return !!person.rels.multipleParents
      }
    },
    'find children': {
      title: 'Look for more children (only {} recorded)',
      check: function (person) {
        if (person.rels.display.lifespan.match(/Living/)) return false
        var range = ageRange(person.rels.display.lifespan)
        if (range[0] > THIS_YEAR - MIN_FIND_CHILDREN) {
          return false
        }
        var totalChildren = 0
        Object.keys(person.rels.families).forEach(function (spouse) {
          totalChildren += person.rels.families[spouse].slice(spouse === 'unknown' ? 0 : 1).length
        })
        if (totalChildren >= MIN_CHILDREN) return false
        return totalChildren
      }
    },



    // WORK HERE
    //
    'find mother': {
      title: 'Find mother',
      check: function (person) {
        return !person.rels.mother
      }
    },
    'find father': {
      title: 'Find father',
      check: function (person) {
        return !person.rels.father
      }
    },
    'verify number of children': {
      title: 'Unusuallly many children ({} recorded)',
      cleanup: true,
      check: function (person) {
        if (person.rels.children.length <= MAX_CHILDREN[person.rels.display.gender]) return false
        return person.rels.children.length 
      }
    },
    'children with unknown spouse': {
      title: 'Children with unknown spouse',
      check: function (person) {
        return !!person.rels.families.unknown
      }
    },
    'abnormallly many marriages': {
      title: 'Abnormally many spouses ({} listed)',
      cleanup: true,
      check: function (person) {
        if (person.rels.spouses.length <= MAX_MARRIAGES[person.rels.display.gender]) return false
        return person.rels.spouses.length
      }
    }
    /** TODO: checks that involve the ages of relatives.
     * Child born after parent's death
     * Child born before parent was 15
     * Person died before their marriage
     * Person married before they were 15
     *
    'child born before parent was of age': {
      title: 'Child born before parent was ' + MIN_PARENTING_AGE,
      check: function (person) {
      }
    }
     */
  },
  temple: {
    // TODO: get the data running & figure out what todos we want
  },
  artifacts: {
    // TODO: get the data running... is this important enough to warrant
    // todozing?
  }
}


