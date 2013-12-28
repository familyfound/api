
// get.data(id, done(err, data))
// get.rels(id, done(err, rels))
// get.more(id, done(err, more))
// get.history(id, done(err, items))
function Socket(socket, crawler) {
  this.sock = socket
  this.listen()
}

Socket.prototype = {
  listen: function () {
    // the main entry point. Asks for the fan and for people to work on
    this.sock.on('starred', this.starred.bind(this))
    this.sock.on('crawl', this.crawl.bind(this))
    this.sock.on('pedigree', this.pedigree.bind(this))
    this.sock.on('tree', this.pedigree.bind(this))
    this.sock.on('more', this.crawler.more.bind(this.crawler))
    this.sock.on('history', this.crawler.history.bind(this.crawler))
    this.sock.on('recent_people', this.crawler.recent_people.bind(this.crawler))
  },
  starred: function (done) {
    var that = this
    this.crawler.starred(function (person) {
      that.sock.emit('starred', person)
    }, done)
  },
  pedigree: function (id, gens, done) {
    var that = this
    this.crawler.pedigree(id, gens, function (person) {
      that.sock.emit('person', person)
    }, done)
  },
  crawl: function (id, numpeople, done) {
    var that = this
    this.crawler.crawl(id, numpeople, function (person, hastodos, numcrawled) {
      that.sock.emit('more_person', person, hastodos, numcrawled)
    }, done)
  },
}




