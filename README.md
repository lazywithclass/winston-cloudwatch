winston-cloudwatch [![Build Status](https://travis-ci.org/lazywithclass/winston-cloudwatch.svg?branch=master)](https://travis-ci.org/lazywithclass/winston-cloudwatch) [![David Dependency Overview](https://david-dm.org/lazywithclass/winston-cloudwatch.png "David Dependency Overview")](https://david-dm.org/lazywithclass/winston-cloudwatch)
==================

Send logs to Amazon Cloudwatch using Winston.

## Installing

```sh
$ npm install --save winston winston-cloudwatch
```

## Configuring

AWS configuration works using `~/.aws/credentials` as written in [AWS JavaScript SDK guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials).

I still have to check if everything works ok with ENV variables.

## Usage

Please refer to [AWS CloudWatch Logs documentation](http://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html) for possible contraints that might affect you.
Also have a look at [AWS CloudWatch Logs limits](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/cloudwatch_limits.html).

```js
var winston = require('winston'),
  options = {
    logGroupName: 'your-log-group',
    logStreamName: 'your-log-stream'
  };
winston.add(require('winston-cloudwatch'), options);

winston.error('log this', { and: 'this too' });
```

If you want you could pass AWS keys as options, like so:

```js
var winston = require('winston'),
  options = {
    logGroupName: 'your-log-group',
    logStreamName: 'your-log-stream',
    awsAccessKeyId: 'your-access-key-id',
    awsSecretKey: 'your-secret-key'
  };
winston.add(require('winston-cloudwatch'), options);

winston.error('log this', { and: 'this too' });
```

Please refer to [the provided example](https://github.com/lazywithclass/winston-cloudwatch/blob/master/test/example.js) for more hints.

## Release notes

### 0.2.1

Checking if logs are empty before splicing them.
Logging if getting an error while fetching the token from AWS.

### 0.2.0

Added a `setInterval` around the uploading function, to avoiding flooding AWS and thus getting rejected.

### 0.1.2

Work around to the AWS time limit for sending events.

### 0.1.1

First release
