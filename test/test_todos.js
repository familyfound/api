
var expect = require('expect.js')
  , utils = require('../lib/utils')

var fixtures = {
  'resolve duplicates': {
    yes: [[{
      more: {
        duplicates: [{title: 'a', id: 'we'},{title: 'b', id:'2'}]
      },
      rels: {
        id: ''
      }
    }, {
      2: {
        links: {
          'Click to resolve': 'https://familysearch.org/tree/#view=merge&person=&otherPerson=2'
        },
        args: 'b'
      },
      we: {
        links: {
          'Click to resolve': 'https://familysearch.org/tree/#view=merge&person=&otherPerson=we'
        },
        args: 'a'
      }
    }]],
    no: [{
      more: {
        duplicates: []
      }
    }]
  },
  'fix multiple parents': {
    yes: [[{
      rels: {
        multipleParents: true,
        id: 'pid'
      }
    }, {
      links: {
        'Resolve this on the person page': 'https://familysearch.org/tree/#view=ancestor&person=pid'
      },
      args: true
    }]],
    no: []
  },
  'find birth info': {
    yes: [
      [
        {
          rels: {
            display: {
              name: 'One two three',
              lifespan: '1830'
            }
          }
        },
        {
          args: 'date and place',
          links: {
            'search records': 'yeah'
          }
        }
      ],
    ],
    no: []
  }
}

describe.only('todo checkers', function () {
  var map = utils.todomap()
  Object.keys(fixtures).forEach(function (type) {
    describe(type, function () {
      fixtures[type].yes.forEach(function (person, i) {
        it('should accept #' + (i+1), function () {
          expect(map[type].check(person[0])).to.eql(person[1])
        })
      })
      fixtures[type].no.forEach(function (person, i) {
        it('should reject #' + (i+1), function () {
          expect(map[type].check(person)).to.not.be.ok()
        })
      })
    })
  })
})

