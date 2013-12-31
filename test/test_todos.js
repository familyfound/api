
var expect = require('expect.js')
  , utils = require('../lib/utils')

var fixtures = {
  'resolve duplicates': {
    yes: [{
      more: {
        duplicates: [1,2]
      }
    }],
    no: [{
      more: {
        duplicates: []
      }
    }]
  }
}

describe('todo checkers', function () {
  var map = utils.todomap()
  Object.keys(fixtures).forEach(function (type) {
    describe(type, function () {
      fixtures[type].yes.forEach(function (person, i) {
        it('should accept #' + (i+1), function () {
          expect(map[type].check(person)).to.be.ok()
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

