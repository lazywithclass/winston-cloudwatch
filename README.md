# winston-cloudwatch [v1.1.0](https://github.com/lazywithclass/winston-cloudwatch/blob/master/CHANGELOG.md#110)

Send logs to Amazon Cloudwatch using Winston.

[![Build Status](https://travis-ci.org/lazywithclass/winston-cloudwatch.svg?branch=master)](https://travis-ci.org/lazywithclass/winston-cloudwatch) [![Coverage Status](https://coveralls.io/repos/github/lazywithclass/winston-cloudwatch/badge.svg?branch=master)](https://coveralls.io/github/lazywithclass/winston-cloudwatch?branch=master) [![Dependency Status](https://david-dm.org/lazywithclass/winston-cloudwatch.svg)](https://david-dm.org/lazywithclass/winston-cloudwatch) [![dev dependencies](https://david-dm.org/lazywithclass/winston-cloudwatch/dev-status.svg)](https://david-dm.org/lazywithclass/winston-cloudwatch#info=devDependencies) [![peer dependencies](https://david-dm.org/lazywithclass/winston-cloudwatch/peer-status.svg)](https://david-dm.org/lazywithclass/winston-cloudwatch#info=peerDependencies)
==================

## Features

 * logging to AWS CloudWatchLogs
 * logging to multiple streams
 * logging with multiple levels
 * doesn't try to buffer your unsent logs (you should use more streams)
 * [see options for more](#options)
 * 100% code coverage in lib layer (WIP for the rest)

## Installing

```sh
$ npm install --save winston winston-cloudwatch
```

## Configuring

AWS configuration works using `~/.aws/credentials` as written in [AWS JavaScript SDK guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials).

As specified [in the docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_the_Region):

 > The AWS SDK for Node.js doesn't select the region by default.

so you should take care of that. See the examples below.

If either the group or the stream do not exist they will be created for you.

## Usage

Please refer to [AWS CloudWatch Logs documentation](http://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html) for possible contraints that might affect you.
Also have a look at [AWS CloudWatch Logs limits](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/cloudwatch_limits.html).

```js
var winston = require('winston'),
    WinstonCloudWatch = require('../index');

winston.add(WinstonCloudWatch, {
  logGroupName: 'testing',
  logStreamName: 'first'
});

winston.error('1');
```

You could also log to multiple streams with / without different log levels, have a look at [this example](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples/multiple-loggers.js).

### Options

This is the list of options you could pass as argument to `winston.add`:

 * level - defaults to `info`
 * logGroupName
 * logStreamName
 * awsAccessKeyId
 * awsSecretKey
 * awsRegion
 * jsonMessage - `boolean`, format the message as JSON
 * proxyServer - `String`, use `proxyServer` as proxy in httpOptions
 * uploadRate - `Number`, how often logs have to be sent to AWS. Be careful of not hitting [AWS CloudWatch Logs limits](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/cloudwatch_limits.html), the default is 2000ms.

AWS keys are usually picked by aws-sdk so you don't have to specify them, I provided the option just in case. Remember that `awsRegion` should still be set if you're using IAM roles.

Please refer to [the provided examples](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples) for more hints.
