
// More gets you 1) sources 2) duplicates 3) temple

module.exports = Crawler

function breadthFirst(start, stop, get, onperson, done) {
  var crawled = []
    , lastgen = [start]
    , nextgen = []
    , curgen = 0
  function next() {
    if (lastgen.length === 0) {
      curgen += 1
      lastgen = nextgen
      nextgen = []
      if (
    }
    if (lastgen.length === 0) {
      console.error('Ran out of people to crawl through')
      done(crawled.length)
    }
    var pid = lastgen.unshift()
    if (crawled.indexOf(pid) !== -1) {
      console.error('crawling twice', pid)
      return next()
    }
    crawled.push(pid)
    get(pid, function (err, person) {
      if (err) {
        console.error('Error while getting more', pid)
        return next()
      }
      nextgen = nextgen.concat(person.rels.parents)
      onperson(person, crawled.length)
      if (!stop(crawled.length, curgen)) {
        next()
      } else {
        done(crawled.length)
      }
    })
  }
  next()
},

// get: {more, rels, data}
//
function Crawler(token, options) {
  this.cache = {
    rels: {},
    more: {},
    data: {}
  }
  this.options = options
}

Crawler.prototype = {
  starred: function (onperson, done) {
    var that = this
    this.options.get.starred(function (err, people) {
      if (err) {
        console.error('Error while retrieving starred people')
        return done()
      }
      async.parallel(people.map(function (data) {
        return function (next) {
          that.cache.data[data.id] = data
          that.getMore(data.id, function (err, person) {
            onperson(person)
            next()
          })
        }
      }), function () {
        done()
      })
    })
  },
  crawl: function (start, num, onperson, done) {
    var gotten = 0
    breadthFirst(start, function () {
      return gotten > num
    }, this.getMore.bind(this), function (person, crawled) {
      onperson(person, !!person.more.todos.length, crawled)
      if (person.more.todos.length) {
        gotten += 1
      }
    }, done)
  },
  pedigree: function (start, gens, onperson, done) {
    breadthFirst(start, function (crawled, gen) {
      return gen > gens
    }, this.getPerson.bind(this), onperson, done)
  },
  get: function (what, id, done) {
    if (this.cache[what][id]) {
      return done(null, this.cache[what][id])
    }
    var that = this
    this.options.get[what](id, function (err, data) {
      if (err) return done(err)
      that.cache[what][id] = data
      done(null, data)
    })
  },
  getMore: function (id, done) {
    async.parallel({
      rels: this.get.bind(this, 'rels', id),
      more: this.get.bind(this, 'more', id),
      data: this.get.bind(this, 'data', id),
    }, function (err, person) {
      if (err) return done(err)
      person.data.todos = utils.mergeTodos(person)
      that.options.saveTodos(id, person.data.todos)
      done(null, person)
    })
    done.bind(null, id))
  },
  getPerson: function (id, done) {
    async.parallel({
      rels: this.get.bind(this, 'rels', id),
      data: this.get.bind(this, 'data', id),
    }, done)
  },
  history: function (done) {
    this.options.get.history(this.token, done)
  },
  recent_people: function (done) {
    this.options.get.recent_people(this.token, done)
  },
}

