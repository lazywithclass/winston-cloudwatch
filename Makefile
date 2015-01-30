testem:
	./node_modules/.bin/testem

test:
	./node_modules/.bin/mocha --compilers coffee:coffee-script/register --reporter spec test/main.coffee

.PHONY: test
