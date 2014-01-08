
module.exports = Socket

// get.data(id, done(err, data))
// get.rels(id, done(err, rels))
// get.more(id, done(err, more))
// get.history(id, done(err, items))
function Socket(socket, crawler) {
  this.sock = socket
  this.crawler = crawler
  this.listen()
  this.cancellor = null
}

Socket.prototype = {
  listen: function () {
    // the main entry point. Asks for the fan and for people to work on
    this.sock.on('getsome', this.getsome.bind(this))

    this.sock.on('starred', this.starred.bind(this))
    this.sock.on('crawl', this.crawl.bind(this))
    this.sock.on('pedigree', this.pedigree.bind(this))
    this.sock.on('tree', this.pedigree.bind(this))
    // this.sock.on('more', this.crawler.more.bind(this.crawler))
    // this.sock.on('history', this.crawler.history.bind(this.crawler))
    // this.sock.on('recent_people', this.crawler.recent_people.bind(this.crawler))
  },
  starred: function (done) {
    var that = this
    this.crawler.starred(function (person) {
      that.sock.emit('starred', person)
    }, done)
  },
  pedigree: function (id, gens, done) {
    var that = this
    this.crawler.pedigree(id, gens, function (id, person) {
      that.sock.emit('person', id, person)
    }, done)
  },
  crawl: function (id, numpeople, done) {
    var that = this
    this.crawler.crawl(id, numpeople, function (id, person, hastodos, numcrawled) {
      that.sock.emit('more_person', id, person, hastodos, numcrawled)
    }, done)
  },
  getsome: function (id, gens, numpeople, done) {
    if (this.cancellor) this.cancellor()
    var tree = null
      , craw = null
      , finished = 0
    this.cancellor = function () {
      tree()
      craw()
    }
    function doneone() {
      finished += 1
      if (finished == 2) return done()
    }
    tree = this.pedigree(id, gens, doneone)
    craw = this.crawl(id, numpeople, doneone)
  }
}




