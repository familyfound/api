
var links = require('./fslinks')
  , MIN_SOURCES = 3
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
      history: 'Resolved duplicate',
      help: 'Click "resolve" to look at this person compared to the possible duplicate. If you determine they are the same person, merge them together, otherwise mark "not a match".',
      help_link: 'https://help.familysearch.org/kb/UserGuide/en/tree/t_tree_combining_separating_records.html',
      cleanup: true,
      multi: true,
      check: function (person) {
        if (!person.more.duplicates || !person.more.duplicates.length) return false
        var res = {}
        person.more.duplicates.map(function (dup) {
          var title = dup.title.replace(/^Person /, '').replace('(', '"').replace(')', '"')
          res[dup.id] = {
            links: {
              'Click to resolve': links.merge(person.rels.id, dup.id)
            },
            args: title
          }
        })
        return res
      }
    },
    'find name': {
      title: 'Find name',
      history: 'Found name',
      help: "Search in records of relatives for this person's name.",
      check: function (person) {
        return !person.rels.display.name && {
          args: !person.rels.display.name,
          links: {
            'search records': links.simpleSearch(person)
          }
        }
      }
    },
    'find birth info': {
      title: 'Find birth {}',
      history: 'Found birth information',
      help: "This information is most likely to be found on a birth record or census record, but many other records can also be helpful.",
      help_link: 'https://familysearch.org/ask/productSupport#/How-to-find-an-ancestor-using-FamilySearch-org-Search-1381813529455',
      check: function (person) {
        var tofind = []
        if (!person.rels.display.birthDate) {
          tofind.push('date')
        }
        if (!person.rels.display.birthPlace) {
          tofind.push('place')
        }
        if (!tofind.length) return false
        return {
          args: tofind.join(' and '),
          links: {
            'search records': links.simpleSearch(person)
          }
        }
      }
    },
    'find death info': {
      title: 'Find death {}',
      history: 'Found death {}',
      help: "If you can find a death record, that is the best. Otherwise, you might find information in an obituary or biography.",
      help_link: "https://familysearch.org/learn/wiki/en/How_to_Find_United_States_Death_Records",
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
        return {
          args: tofind.join(' and '),
          links: {
            'search for records': links.simpleSearch(person, [2,4,5,6,7])
          }
        }
      }
    },
    'death before birth': {
      title: 'Death date {} years before birth date',
      history: 'Fixed date inconsistency',
      help: "Something's wrong here; figure out which date is (more) correct, and adjust the other accordingly",
      cleanup: true,
      check: function (person) {
        var range = ageRange(person.rels.display.lifespan)
        if (range[0] === false || range[1] === false) return false
        if (range[0] <= range[1]) return false
        return {
          args: range[0] - range[1],
          links: {
            'go to his page': links.personPage(person.rels.id)
          }
        }
      }
    }
  },
  sources: {
    'find sources': {
      title: 'Look for sources (only {} attached)',
      history: 'Looked for sources',
      help: "Finding sources for people is a key research activity. As you find sources, you will be able to correct possible data inconsistencies, and more importantly you might find relatives who have been missed. Attaching sources also adds validity to a record.",
      help_link: 'https://familysearch.org/ask/productSupport#/How-to-find-an-ancestor-using-FamilySearch-org-Search-1381813529455',
      check: function (person) {
        // TODO: should "minimum number of sources" be configurable?
        if (person.rels.display.lifespan.match(/Living/)) return false
        var sources = person.more.sources ? person.more.sources.length : 0
        if (sources >= MIN_SOURCES) return false
        return {
          args: sources,
          links: {
            'simple search': links.simpleSearch(person)
          }
        }
      },
    },
  },
  relationships: {
    'child to more than one spouse': {
      title: 'The child {} is associated with more than one spouse',
      history: 'Fixed problem with a child & multiple spouses',
      help: "A child should (generally) only have one set of parents. It is often the case that the multiple parents are in fact duplicates of each other, which can then be merged.",
      help_link: 'http://broadcast.lds.org/elearning/fhd/Community/en/FamilyTreeCurriculum/level02/relationships/Duplicate%20Spouses%20Merge.mp4',
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
        return it && {
          args: it,
          links: {
            "go to the child's person page": links.personPage(it)
          }
        }
      },
    },
    'parent of self': {
      title: "I'm my own grandpa",
      history: 'Cleared up "I\'m my own grandpa" syndrome',
      help: "This person is listed as their own parent. Remove the relationship and check for other inconsistencies",
      help_link: 'https://help.familysearch.org/kb/UserGuide/en/tree/t_tree_adding_correcting_information.html',
      cleanup: true,
      check: function (person) {
        return person.rels.parents.indexOf(person.rels.id) !== -1 && {
          args: true,
          links: {
            'Go to the person page': links.personPage(person.rels.id)
          }
        }
      },
    },
    'fix multiple parents': {
      title: 'Fix multiple parents',
      history: 'Cleared up multiple parents issue',
      help: "A child should (generally) only have one set of parents. It is often the case that the multiple parents are in fact duplicates of each other, which can then be merged.",
      help_link: 'http://broadcast.lds.org/elearning/fhd/Community/en/FamilyTreeCurriculum/level02/relationships/Duplicate%20Spouses%20Merge.mp4',
      cleanup: true,
      check: function (person) {
        return !!person.rels.multipleParents && {
          args: true,
          links: {
            'Resolve this on the person page': links.personPage(person.rels.id)
          }
        }
      }
    },
    'find children': {
      title: 'Look for more children (only {} recorded)',
      history: 'Looked for more children',
      help: "When a couple in the tree has few children listed, it is likely that the person doing the research merely concerned themselves with the direct line and didn't (or couldn't) find all of the other children. Census and birth records can be particularly helpful in finding more children.",
      help_link: 'https://familysearch.org/learningcenter/lesson/easy-steps-to-descendancy-research/877',
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
        return {
          args: totalChildren,
          links: {
            'Search records': links.simpleSearch(person)
          }
        }
      }
    },

    // WORK HERE
    //
    'find mother': {
      title: 'Find mother',
      history: 'Found mother',
      help: "You might find information about the mother's name on a marriage record or death record, in addition to the usual census and birth records",
      check: function (person) {
        return !person.rels.mother && {
          args: true,
          links: {
            'Find records': links.simpleSearch(person)
          }
        }
      }
    },
    'find father': {
      title: 'Find father',
      history: 'Found father',
      help: "You might find information about the father's name on a marriage record or death record, in addition to the usual census and birth records.",
      check: function (person) {
        return !person.rels.father && {
          args: true,
          links: {
            'Find records': links.simpleSearch(person)
          }
        }
      }
    },
    'verify number of children': {
      title: 'Unusuallly many children ({} recorded)',
      history: 'Verified number of children (unusually high)',
      help: "While very large families did happen, it might also be the case that there are several duplicate children, or that unrelated children were added by accident, perhaps through an erroneous merge.",
      cleanup: true,
      check: function (person) {
        if (person.rels.children.length <= MAX_CHILDREN[person.rels.display.gender]) return false
        return {
          args: person.rels.children.length,
          links: {
            'Check the children for duplicates or other errors': links.personPage(person.rels.id)
          }
        }
      }
    },
    'children with unknown spouse': {
      title: 'Children with unknown spouse',
      history: 'Cleared up children w/ unknown spouse',
      help: "Verify the relationships with the children (check other spouses especially), and then look for records to find the spouse's name and information.",
      check: function (person) {
        return !!person.rels.families.unknown && {
          args: true,
          links: {
            'Look at relationships on the person page': links.personPage(person.rels.id),
            'Search for records': links.simpleSearch(person)
          }
        }
      }
    },
    'abnormallly many marriages': {
      title: 'Unusually many spouses ({} listed)',
      history: 'Verified unusually high number of spouses',
      help: "Check for duplicate spouses or information inconsistencies, and then try to find marriage records to substantiate the relationships that are left.",
      cleanup: true,
      check: function (person) {
        if (person.rels.spouses.length <= MAX_MARRIAGES[person.rels.display.gender]) return false
        return person.rels.spouses.length && {
          args: true,
          links: {
            'Look at relationships on the person page': links.personPage(person.rels.id)
          }
        }
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


