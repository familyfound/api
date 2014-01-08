
var MIN_SOURCES = 3
  , MIN_PARENTING_AGE = 15
  , MIN_CHILDREN = 3
  , MAX_CHILDREN = {
      'Male': 30,
      'Female': 15
    }
  , MAX_MARRIAGES = {
      'Male': 10,
      'Female': 5
    }

function ageRange(range) {
  var parts = range.split('-')
  return parts.map(function (p) {
    return parseInt(p, 10) || false
  })
}

module.exports = {
  information: {
    'resolve duplicates': {
      title: 'Resolve duplicates',
      check: function (person) {
        return person.more.duplicates && person.more.duplicates.length > 0
      }
    },
    'find birth info': {
      title: 'Find birth information',
      check: function (person) {
        return !person.rels.display.birthDate || !person.rels.display.birthPlace
      }
    },
    'find death info': {
      title: 'Find death information',
      check: function (person) {
        if (person.rels.display.lifespan.match(/Living/)) return false
        return !person.rels.display.deathDate || !person.rels.display.deathPlace
      }
    },
    'death before birth': {
      title: 'Death date before birth date',
      check: function (person) {
        var range = ageRange(person.rels.display.lifespan)
        if (range[0] === false || range[1] === false) return false
        return range[0] > range[1]
      }
    }
  },
  sources: {
    'find sources': {
      title: 'Find sources (at least ' + MIN_SOURCES + ')',
      check: function (person) {
        // TODO: should "minimum number of sources" be configurable?
        if (person.rels.display.lifespan.match(/Living/)) return false
        return !person.more.sources || person.more.sources.length < MIN_SOURCES
      },
    },
  },
  relationships: {
    'child to more than one spouse': {
      title: 'A child is associated with more than one spouse',
      check: function (person) {
        var seen = []
        return Object.keys(person.rels.families).some(function (spouse) {
          return person.rels.families[spouse].slice(spouse === 'unknown' ? 0 : 1).some(function (child) {
            if (seen.indexOf(child) !== -1) return true
            seen.push(child)
            return false
          })
        })
      },
    },
    'fix multiple parents': {
      title: 'Fix multiple parents',
      check: function (person) {
        return person.rels.multipleParents
      }
    },
    'find children': {
      title: 'Find children',
      check: function (person) {
        var fewChildren = false
        if (person.rels.display.lifespan.match(/Living/)) return false
        return Object.keys(person.rels.families).some(function (spouse) {
          return person.rels.families[spouse].slice(spouse === 'unknown' ? 0 : 1).length < MIN_CHILDREN
        })
      }
    },
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
      title: 'Verify number of children (unusually many)',
      check: function (person) {
        return person.rels.children.length > MAX_CHILDREN[person.rels.display.gender]
      }
    },
    'children with unknown spouse': {
      title: 'Children with unknown spouse',
      check: function (person) {
        return person.rels.families.unknown
      }
    },
    'abnormallly many marriages': {
      title: 'Abnormally many marriages',
      check: function (person) {
        return person.rels.spouses.length > MAX_MARRIAGES[person.rels.display.gender]
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


