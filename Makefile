CWD = $(shell pwd)
NAME = winston-cloudwatch
BUILD_NAME = ${NAME}-build


build:
	docker build -t ${BUILD_NAME} .

dev:
	./node_modules/.bin/mocha test --recursive --require should -w

test:
	./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha test -- --recursive --require should -R dot

docker:
	docker run -v ${CWD}:/workspace --rm -it ${BUILD_NAME} /bin/bash

.PHONY: test
