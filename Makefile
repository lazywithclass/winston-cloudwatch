dev:
	./node_modules/.bin/mocha test --recursive --require should -w

test:
	./node_modules/.bin/istanbul cover _mocha test -- --recursive --require should -R dot

.PHONY: test
