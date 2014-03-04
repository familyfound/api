
module.exports = {
  simpleSearch: simpleSearch,
  merge: merge,
  personPage: personPage
}

function getYear(text) {
  return parseInt((text || '').match(/\d{4}/))
}

function fsQuery(person) {
  var display = person.rels.display
    , parts = display.name.split(' ')
    , lastName = parts.pop()
    , firstNames = parts.join(' ')
  var query = '+givenname:"' + firstNames + '"~+surname:"' + lastName + '"~+birth_place:"' + display.birthPlace + '"~'
    , birthYear
  if (display.birthDate && (birthYear = getYear(display.birthDate))) {
    query += '+birth_year:' + (birthYear - 2) + '-' + (birthYear + 2) + '~'
  }
  return query
}

function simpleSearch(person, records) {
  var display = person.rels.display
    , parts = display.name.split(' ')
    , lastName = parts.pop()
    , firstNames = parts.join(' ')
  var query = '+givenname:"' + firstNames + '"~+surname:"' + lastName + '"~+birth_place:"' + display.birthPlace + '"~'
    , birthYear
  if (display.birthDate && (birthYear = getYear(display.birthDate))) {
    query += '+birth_year:' + (birthYear - 2) + '-' + (birthYear + 2) + '~'
  }
  if (records) {
    query += ' +record_type:(' + records.join(' ') + ')'
  }
  return 'https://familysearch.org/search/record/results#count=20&query=' + encodeURIComponent(query)
}

function merge(pid, oid) {
  return 'https://familysearch.org/tree/#view=merge&person=' + pid + '&otherPerson=' + oid
}

function personPage(pid) {
  return 'https://familysearch.org/tree/#view=ancestor&person=' + pid
}


