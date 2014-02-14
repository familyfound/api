
var expect = require('expect.js')
  , KillableQueue = require('../lib/killablequeue')

describe('KillableQueue', function () {
  it('should execute things', function (done) {
    var did = 0
    var k = new KillableQueue(1, function (num, next) {
      process.nextTick(function () {
        did += 1;
        next()
      })
    }, function () {
      expect(did).to.equal(5)
      done()
    })
    k.add(2);
    k.add(3);
    k.add(5);
    k.add(6);
    k.add(7);
  })
  it('should execute in paralel', function (done) {
    var did = 0
    var k = new KillableQueue(5, function (num, next) {
      process.nextTick(function () {
        did += 1;
        next()
      })
    }, function () {
      expect(did).to.equal(5)
      done()
    })
    k.add(2);
    k.add(3);
    k.add(5);
    k.add(6);
    k.add(7);
  })
  it('should kill paralel', function (done) {
    var did = 0
    var k = new KillableQueue(5, function (num, next) {
      var cancelled = false
      process.nextTick(function () {
        if (cancelled) return next()
        did += 1;
        next()
      })
      return function () {
        cancelled = true
      }
    }, function () {
      expect(did).to.equal(0)
      done()
    })
    k.add(2);
    k.add(3);
    k.add(5);
    k.add(6);
    k.add(7);
    k.cancel()
  })
  it('should kill serial', function (done) {
    var did = 0
    var k = new KillableQueue(1, function (num, next) {
      var cancelled = false
      process.nextTick(function () {
        if (cancelled) return next()
        did += 1;
        next()
      })
      return function () {
        cancelled = true
      }
    }, function () {
      expect(did).to.equal(0)
      done()
    })
    k.add(2);
    k.add(3);
    k.add(5);
    k.add(6);
    k.add(7);
    k.cancel()
  })
})

