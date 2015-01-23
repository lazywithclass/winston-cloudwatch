winston-cloudwatch [![Build Status](https://travis-ci.org/lazywithclass/winston-cloudwatch.svg?branch=master)](https://travis-ci.org/lazywithclass/winston-cloudwatch) [![David Dependency Overview](https://david-dm.org/lazywithclass/winston-cloudwatch.png "David Dependency Overview")](https://david-dm.org/lazywithclass/winston-cloudwatch)
==================

Send logs to Amazon Cloudwatch using Winston.

# Issues

As of now there are two major issues that I'm fixing:

 * https://github.com/lazywithclass/winston-cloudwatch/issues/3
 * https://github.com/lazywithclass/winston-cloudwatch/issues/1

I am working on those, please note that they do prevent the module from working properly in certain cases.

## Installing

```sh
$ npm install --save winston winston-cloudwatch
```

## Configuring

AWS configuration works using `~/.aws/credentials` as written in [AWS JavaScript SDK guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials).

I still have to check if everything works ok with ENV variables.

## Usage

Please refer to [AWS CloudWatch Logs documentation](http://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html) for possible contraints that might affect you.

```js
var winston = require('winston'),
  options = {
    logGroupName: 'your-log-group',
    logStreamName: 'your-log-stream'
  };
winston.add(require('winston-cloudwatch'), options);

winston.error('log this', { and: 'this too' });
```

## Release notes

### 0.1.2

Work around to the AWS time limit for sending events.

### 0.1.1

First release
