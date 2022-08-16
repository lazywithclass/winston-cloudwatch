# winston-cloudwatch [v6.1.0](https://github.com/lazywithclass/winston-cloudwatch/blob/master/CHANGELOG.md#610)

[![Build Status](https://travis-ci.org/lazywithclass/winston-cloudwatch.svg?branch=master)](https://travis-ci.org/lazywithclass/winston-cloudwatch) [![Coverage Status](https://coveralls.io/repos/github/lazywithclass/winston-cloudwatch/badge.svg?branch=master)](https://coveralls.io/github/lazywithclass/winston-cloudwatch?branch=master)
==================

Send logs to Amazon Cloudwatch using [Winston](https://github.com/winstonjs/winston)

Starting from version 3.0.0 we moved aws-sdk into devDependencies to reduce the size of the package, so if you're not using this on AWS Lambda make sure you add aws-sdk dependency into your application package.json.

If you were using this library before version 2.0.0 have a look at the 
[migration guide for Winston](https://github.com/winstonjs/winston/blob/master/UPGRADE-3.0.md) and at the updated
[examples](examples).

 * [Features](#features)
 * [Installing](#installing)
 * [Configuring](#configuring)
 * [Usage](#usage)
 * [Options](#options)
 * [Examples](#examples)
 * [Simulation](#simulation)

### Features

 * logging to AWS CloudWatchLogs
 * [logging to multiple streams](#logging-to-multiple-streams)
 * [programmatically flush logs and exit](#programmatically-flush-logs-and-exit)
 * logging with multiple levels
 * creates group / stream if they don't exist
 * waits for an upload to suceed before trying the next
 * truncates messages that are too big
 * batches messages taking care of the AWS limit (you should use more streams if you hit this a lot)
 * support for Winston's uncaught exception handler
 * support for TypeScript, see [TypeScript definition](https://github.com/lazywithclass/winston-cloudwatch/blob/master/typescript/winston-cloudwatch.d.ts)
 * [see options for more](#options)

### Installing

```sh
$ npm install --save winston winston-cloudwatch @aws-sdk/client-cloudwatch-logs
```

Also consider that we have both winston and @aws-sdk/client-cloudwatch-logs configured as peerDependencies.

### Configuring

AWS configuration works using `~/.aws/credentials` as written in [AWS JavaScript SDK guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials).

As a best practice remember to use one stream per resource, so for example if you have 4 servers you should setup 4 streams
on AWS CloudWatch Logs, this is a general best practice to avoid incurring in token clashes and to avoid limits of the service (see [usage](#usage) for more).

#### Credentials

Use `awsOptions` to set your credentials, like so:

```JavaScript
new WinstonCloudWatch({
  ...,
  awsOptions: {
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    region,
  }
})
```

#### Region note

As specified [in the docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_the_Region):

 > The AWS SDK for Node.js doesn't select the region by default.

so you should take care of that. See the [examples](#examples) below.

If either the group or the stream do not exist they will be created for you.

#### AWS UI

For displaying time in AWS CloudWatch UI you should click on the gear in the top right corner in the page with your logs and enable checkbox "Creation Time".

##### TypeScript

Remember to install types for both winston and this library.

### Usage

Please refer to [AWS CloudWatch Logs documentation](http://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html) for possible contraints that might affect you.
Also have a look at [AWS CloudWatch Logs limits](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/cloudwatch_limits_cwl.html).

In ES5
```js
var winston = require('winston'),
    WinstonCloudWatch = require('winston-cloudwatch');
```

In ES6
```js
import winston from 'winston';
import * as WinstonCloudWatch from 'winston-cloudwatch';
```

```js
winston.add(new WinstonCloudWatch({
  logGroupName: 'testing',
  logStreamName: 'first'
}));

winston.error('1');
```

You can also specify a function for the `logGroupName` and `logStreamName` options. This is handy if you are using this module in a server, say with [express](https://github.com/bithavoc/express-winston), as it enables you to easily split streams across dates, for example. There is an example of this [here](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples/function-config.js).

#### Logging to multiple streams

You could also log to multiple streams with / without different log levels, have a look at [this example](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples/multiple-loggers.js).

Consider that when using this feature you will have two instances of winston-cloudwatch, each with its own `setInterval` running.

#### Programmatically flush logs and exit

Think AWS Lambda for example, you don't want to leave the process running there for ever waiting for logs to arrive.

You could have winston-cloudwatch to flush and stop the setInterval loop (thus exiting), have a look
at [this example](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples/flush-and-exit.js).

#### Custom AWS.CloudWatchLogs instance

```js
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-1',
});

winston.add(new WinstonCloudWatch({
  cloudWatchLogs: new AWS.CloudWatchLogs(),
  logGroupName: 'testing',
  logStreamName: 'first'
}));

```

### Options

This is the list of options you could pass as argument to `winston.add`:

 * name - `string`
 * level - defaults to `info`
 * logGroupName - `string` or `function`
 * logStreamName - `string` or `function`
 * cloudWatchLogs - `AWS.CloudWatchLogs` instance, used to set custom AWS instance.
 * awsAccessKeyId
 * awsSecretKey
 * awsRegion
 * awsOptions - `object`, params as per [docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatchLogs.html#constructor-property), values in `awsOptions` are overridden by any other if specified, run [this example](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples/simple-with-aws-options.js) to have a look
 * jsonMessage - `boolean`, format the message as JSON
 * messageFormatter - `function`, format the message the way you like. This function will receive a `log` object that has the following properties: `level`, `message`, and `meta`, which are passed by winston to the `log` function (see [CustomLogger.prototype.log as an example](https://github.com/winstonjs/winston#adding-custom-transports))
 * uploadRate - `Number`, how often logs have to be sent to AWS. Be careful of not hitting [AWS CloudWatch Logs limits](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/cloudwatch_limits_cwl.html), the default is 2000ms.
 * errorHandler - `function`, invoked with an error object, if not provided the error is sent to `console.error`
 * retentionInDays - `Number`, defaults to `0`, if set to one of the possible values `1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, and 3653` the retention policy on the log group written will be set to the value provided.

AWS keys are usually picked by `aws-sdk` so you don't have to specify them, I provided the option just in case. Remember that `awsRegion` should still be set if you're using IAM roles.

### Examples

Please refer to [the provided examples](https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples) for more hints.

Note that when running the examples the process will not exit because of the [`setInterval`](https://github.com/lazywithclass/winston-cloudwatch/blob/master/index.js#L73)

### Simulation

You could simulate how winston-cloudwatch runs by using the files in 
`examples/simulate`:

 * `running-process.js` represents a winston-cloudwatch process that sits there,
 sends a couple logs then waits for a signal to send more
 * `log.sh` is a script that you could run to send logs to the above
 
At this point you could for example run `log.sh` in a tight loop, like so

```bash
$ while true; do ./examples/simulate/log.sh $PID; sleep 0.2; done
```

and see what happens in the library, this might be useful to test if you need
more streams for example, all you need to do is change `running-process.js` to
better reflect your needs.

If you want more detailed information you could do

```bash
$ WINSTON_CLOUDWATCH_DEBUG=true node examples/simulate/running-process.js
```

which will print lots of debug statements as you might've guessed.
