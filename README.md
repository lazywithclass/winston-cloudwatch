winston-cloudwatch [![Build Status](https://travis-ci.org/lazywithclass/winston-cloudwatch.svg?branch=master)](https://travis-ci.org/lazywithclass/winston-cloudwatch) 

[![Dependency Status](https://david-dm.org/lazywithclass/winston-cloudwatch.svg)](https://david-dm.org/lazywithclass/winston-cloudwatch) [![dev dependencies](https://david-dm.org/lazywithclass/winston-cloudwatch/dev-status.svg)](https://david-dm.org/lazywithclass/winston-cloudwatch#info=devDependencies) [![peer dependencies](https://david-dm.org/lazywithclass/winston-cloudwatch/peer-status.svg)](https://david-dm.org/lazywithclass/winston-cloudwatch#info=peerDependencies)
==================

Send logs to Amazon Cloudwatch using Winston.

## Installing

```sh
$ npm install --save winston winston-cloudwatch
```

## Configuring

AWS configuration works using `~/.aws/credentials` as written in [AWS JavaScript SDK guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials).

As specified [in the docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_the_Region)

 > The AWS SDK for Node.js doesn't select the region by default.
 
so you should take care of that. See the examples below.

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

The default level is `info`, you could override that, to `silly` for example, like so:

```js
var winston = require('winston'),
  options = {
    level: 'silly',
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
    awsSecretKey: 'your-secret-key',
    awsRegion: 'your-region'
  };
winston.add(require('winston-cloudwatch'), options);

winston.error('log this', { and: 'this too' });
```

Please refer to [the provided example](https://github.com/lazywithclass/winston-cloudwatch/blob/master/test/example.js) for more hints.
