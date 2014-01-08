/** for sanity **/

var person = {
	data: {
		starred: false,
		todos: [],
		customTodos: [],
    done: false
	},// from db
	rels: {
		display: {},
		parents: [],
		mother: '',
		father: '',
		families: {
			null: [],
		}
	},
	more: {
		sources: ['description',],
		duplicates: [{
			score: 0,
			title: ''
		}]
	}
}


