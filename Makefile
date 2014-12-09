
build: components client/index.js client/utils.js lib/todos.js
	@component build --dev

components: component.json
	@component install --dev

lint:
	@jshint --verbose lib test

test:
	@mocha -R spec test

clean:
	rm -fr build components template.js

docs:
	@node docme.js

.PHONY: clean test lint docs
