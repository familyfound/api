
var BaseManager = require('manager')

function Manager(io) {
	BaseManager.call(this, {
		genId: function () {
			throw new Error("You're not supposed to create people")
		},
		defaultNode: {
			data: {},
			rels: {},
			more: {}
		}
	})
	var that = this
	io.on('person', function (id, person) {
		that.set(id, person)
	})
  io.on('more_person', function (id, person, hastodos, numcrawled) {
    that.set(id, person)
  })
}

