
var Crawler = require('../lib/crawler')
  , fslayer = require('../lib/fslayer')
  , Db = require('../lib/db')
  , CrawlApi = require('../lib/crawl-api')
  , userId = process.env.PID
  , token = process.env.TOKEN
  , skip = !userId || !token

  , fs = require('fs')
  , sinon = require('sinon')
  , expect = require('expect.js')

if (fs.existsSync(__dirname + '/.special')) {
  var parts = fs.readFileSync(__dirname + '/.special', 'utf8').trim().split(':')
  userId = parts[0]
  token = parts[1]
  skip = false
}
skip = skip || !process.env.INTEG

;(skip ? describe.skip : describe)('Crawler Impl tests', function () {
  this.timeout(10000)

  var cached = null
    , _db = null
    , db
    , api
    , crawler

  before(function (done) {
    fslayer('mongodb://localhost/ff-test', function (err, _cached, __db) {
      cached = _cached
      _db = __db
      done()
    })
  })

  beforeEach(function () {
    db = new Db(_db, userId)
    api = new CrawlApi(userId, token, cached)
    crawler = new Crawler(api, db)
  })

  it('should crawl simply', function (done) {
    var personcb = sinon.spy()
      , morecb = sinon.spy()
      , tododcb = sinon.spy()
    crawler.on('person', personcb)
    crawler.on('person:more', morecb)
    crawler.on('todos:done', tododcb)
    crawler.on('error', function (err) {
      done(err)
    })
    crawler.on('pedigree:done', function (num, time) {
      // console.log('finished getting pedigree', num, time)
      expect(num).to.equal(7)
      expect(personcb.callCount).to.equal(7)
      expect(morecb.called).to.not.be.ok()
      expect(tododcb.called).to.not.be.ok()
      done()
    })
    crawler.getPedigree(userId, 2)
  })

  it('should get more', function (done) {
    this.timeout(10000)
    var personcb = sinon.spy()
      , morecb = sinon.spy()
    crawler.on('person', personcb)
    crawler.on('person:more', morecb)
    crawler.on('error', function (err) {
      done(err)
    })
    crawler.on('todos:done', function (num, time) {
      // console.log('finished getting pedigree', num, time)
      expect(num).to.be.above(3)
      expect(personcb.called).to.not.be.ok()
      expect(morecb.callCount).to.be.above(1)
      done()
    })
    crawler.getTodos(userId, 1)
  })
})

