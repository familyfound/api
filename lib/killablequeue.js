
module.exports = KillableQueue

function KillableQueue(conc, worker, flushed) {
  this.id = 0
  this.queue = []
  this.working = []
  this.conc = conc
  this.worker = worker
  this.flushed = flushed || function (){}
}

KillableQueue.prototype = {
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
    if (!this.queue.length && !this.working.length) this.flushed()
    this.startNext()
  },
  add: function (payload) {
    this.queue.push(payload)
    this.startNext()
  },
  cancel: function () {
    this.working.forEach(function (item) {
      item.cancel()
    })
    this.working = []
    this.queue = []
    this.flushed()
  },
}

