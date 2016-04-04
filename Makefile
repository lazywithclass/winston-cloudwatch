dev:
	./node_modules/.bin/mocha test/cloudwatch-integration.js --require should -w

test:
	./node_modules/.bin/istanbul cover _mocha test/cloudwatch-integration.js -- --require should -R spec

.PHONY: test
