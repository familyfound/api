
module.exports = KillableQueue

/**
 * Responsible for:
 * - tracking the number of items that were completed
 * - tracking the time elapsed from start to finish
 * - cancelling things
 */

function KillableQueue(conc, worker, flushed) {
  this.id = 0
  this.queue = []
  this.working = []
  this.conc = conc
  this.running = false
  this.worker = worker
  this.flushed = flushed || function (){}
  this.starttime = null
  this.count = 0
}

KillableQueue.prototype = {
  start: function (payload) {
    this.running = true
    this.starttime = new Date().getTime()
    this.count = 0
    this.add(payload)
  },
  startNext: function () {
    if (this.working.length >= this.conc) return false
    if (!this.queue.length) return false
    var payload = this.queue.shift()
    this.id++;
    this.working.push({
      id: this.id,
      cancel: this.worker(payload, this.done.bind(this, this.id))
    })
    return true
  },
  remove: function (id) {
    for (var i=0; i<this.working.length; i++) {
      if (this.working[i].id === id) {
        this.working.splice(i, 1)
        return true
      }
    }
  },
  done: function (id) {
    if (!this.remove(id)) {
      console.error('Tried to "done" a job that was already removed...')
      return
    }
    this.count += 1
    if (!this.queue.length && !this.working.length) this.finished()
    this.startNext()
  },
  add: function (payload) {
    this.queue.push(payload)
    this.startNext()
  },
  cancel: function (quiet) {
    this.working.forEach(function (item) {
      if ('function' === typeof item.cancel) item.cancel()
    })
    this.working = []
    this.queue = []
    this.finished(quiet)
  },
  finished: function (quiet) {
    if (!this.running) return
    this.running = false
    if (!quiet) this.flushed(this.count, new Date().getTime() - this.starttime)
    this.count = 0
    this.starttime = null
  },
}

