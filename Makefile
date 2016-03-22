dev:
	./node_modules/.bin/mocha test/cloudwatch-integration.js --require should -w

test:
	./node_modules/.bin/mocha test/cloudwatch-integration.js --require should

cover:
	./node_modules/.bin/istanbul cover _mocha -- --require should -R spec

.PHONY: test
